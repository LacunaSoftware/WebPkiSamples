package sample.controller;

import org.apache.commons.io.IOUtils;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;
import sample.model.SignatureParamsModel;
import sample.model.SignatureResultModel;
import sample.util.Util;

import javax.xml.crypto.MarshalException;
import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;

/*
 * This is the controller responsible for the double XML element signature sample, on which
 * two XML elements, one containing the other, are signed with the same certificate.
 *
 * This controller responds two routes:
 *
 * GET  /double-xml-element-signature             - renders the signature page
 * POST /double-xml-element-signature/start (API) - initiates the signature of the inner element
 * POST /double-xml-element-signature/step1 (API) - completes the signature of the inner element, starts the signature
 *                                                  of the outer element
 * POST /double-xml-element-signature/step2 (API) - completes the signature of the outer element
 * GET  /double-xml-element-signature/info        - renders the success page with the download link
 */
@Controller
public class DoubleXmlElementSignatureController {

    /*
     * GET /double-xml-element-signature
     *
	 * This action renders the signature page.
	 */
    @RequestMapping(value = "/double-xml-element-signature", method = {RequestMethod.GET})
    public String get() throws Exception {
        return "double-xml-element-signature";
    }

    /*
     * POST /double-xml-element-signature/start (API)
     *
     * This API action, called via AJAX from the signature page, initiates the signature of the inner XML element and
     * returns the signature parameters (to-sign-hash and action to which the result should be posted).
     */
    @RequestMapping(value = "/double-xml-element-signature/start", method = {RequestMethod.POST})
    public @ResponseBody SignatureParamsModel start() throws Exception {

        // Open the XML to be signed
        Document doc = openXml(Util.getSampleLoteRps());

        // Sign the inner element using a dummy key
        XMLSignature sig = signWithDummyKey(doc, "InfRps");

        // Compute the "to sign hash" based on the dummy signature
        String toSignHash = getToSignHashBase64(sig);

        // Return model with the signature parameters:
        // - toSignHash computed above
        // - action to which the result should be posted (method step1 below)
        SignatureParamsModel model = new SignatureParamsModel();
        model.toSignHash = toSignHash;
        model.action = "/double-xml-element-signature/step1";
        return model;
    }

    /*
     * POST /double-xml-element-signature/step1 (API)
     *
     * This API action, called via AJAX from the signature page with the result of the signature of the inner XML
     * element, completes the signature of that element and starts the signature of the outer element. It returns
     * the signature parameters for the outer element (to-sign-hash and action to which the result should be posted).
     */
    @RequestMapping(value = "/double-xml-element-signature/step1", method = {RequestMethod.POST})
    public @ResponseBody SignatureParamsModel step1(@RequestBody SignatureResultModel request) throws Exception {

        // Open the XML to be signed
        Document doc = openXml(Util.getSampleLoteRps());

        // Once again, sign the inner element using a dummy key
        signWithDummyKey(doc, "InfRps");

        // Replace Signature elements with certificate and signature value, both with Base64-encoding
        replaceSignatureElements(doc, request.certificate, request.signature);

        // Encode the XML with the inner element signed
        byte[] signedXml = encodeXml(doc);

        // Save the signed XML
        String filename = Util.StoreFile(signedXml, ".xml");

        // Open the signed XML to sign the outer element
        Document doc2 = openXml(signedXml);

        // Sign the outer element using a dummy key
        XMLSignature sig = signWithDummyKey(doc2, "LoteRps");

        // Compute the "to sign hash" based on the dummy signature
        String toSignHash = getToSignHashBase64(sig);

        // Return model with the signature parameters:
        // - toSignHash computed above
        // - action to which the result should be posted (method step2 below)
        SignatureParamsModel model = new SignatureParamsModel();
        model.toSignHash = toSignHash;
        model.action = "/double-xml-element-signature/step2?filename=" + filename;
        return model;
    }

    /*
     * POST /double-xml-element-signature/step2 (API)
     *
     * This API action, called via AJAX from the signature page with the result of the signature of the outer XML
     * element, completes the signature of that element and instructs the page to redirect the user to the "info" action.
     */
    @RequestMapping(value = "/double-xml-element-signature/step2", method = {RequestMethod.POST})
    public @ResponseBody SignatureParamsModel step2(
            @RequestParam(value = "filename", required = true) String filename,
            @RequestBody SignatureResultModel request
    ) throws Exception {

        // Open the XML to be signed
        Document doc = openXml(Util.RecoverFile(filename));

        // Once again, sign the outer element using a dummy key
        signWithDummyKey(doc, "LoteRps");

        // Replace Signature elements with certificate and signature value, both with Base64-encoding
        replaceSignatureElements(doc, request.certificate, request.signature);

        // Save the XML with both elements signed
        String newFilename = Util.StoreFile(encodeXml(doc), ".xml");

        // Return model instructing the Javascript to redirect the user to the "info" action (see method info below)
        SignatureParamsModel model = new SignatureParamsModel();
        model.redirectTo = "/double-xml-element-signature/info?filename=" + newFilename;
        return model;
    }

    /*
     * GET /double-xml-element-signature/info
     *
     * This action renders the success page with the download link.
     */
    @RequestMapping(value = "/double-xml-element-signature/info", method = {RequestMethod.GET})
    public String info(
            @RequestParam(value = "filename", required = true) String filename,
            Model model
    ) throws Exception {
        model.addAttribute("filename", filename);
        return "xml-signature-info";
    }

    private Document openXml(byte[] xmlContent) throws IOException, SAXException, ParserConfigurationException {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        DocumentBuilder builder = dbf.newDocumentBuilder();
        return builder.parse(new ByteArrayInputStream(xmlContent));
    }

    private XMLSignature signWithDummyKey(Document doc, String localName) throws InvalidAlgorithmParameterException, NoSuchAlgorithmException, InvalidKeySpecException, MarshalException, XMLSignatureException {

        XMLSignatureFactory sigFac = XMLSignatureFactory.getInstance("DOM");

        // Get the infNFe element and its ID
        Element toSignElement = (Element)doc.getElementsByTagNameNS("http://www.abrasf.org.br/nfse.xsd", localName).item(0);
        String toSignElementId = toSignElement.getAttribute("Id");

        // Reference the infNFe element by its ID with:
        // - Transformations: "Enveloped" and canonicalization (Canonical XML 1.0)
        // - Digest algorithm: SHA-1
        List<Transform> refTransforms = new ArrayList<>();
        refTransforms.add(sigFac.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null));
        refTransforms.add(sigFac.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null));
        Reference ref = sigFac.newReference(
                "#" + toSignElementId,
                sigFac.newDigestMethod(DigestMethod.SHA1, null),
                refTransforms,
                null,
                null
        );

        // Specify a SignedInfo with:
        // - Canonicalization: Canonical XML 1.0
        // - Signature algorithm: RSA with SHA-1
        // - References: infNFe element
        SignedInfo si = sigFac.newSignedInfo(
                sigFac.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                sigFac.newSignatureMethod(SignatureMethod.RSA_SHA1, null),
                Collections.singletonList(ref)
        );

        // Sign with dummy key
        DOMSignContext dsc = new DOMSignContext(getDummyPrivateKey(), toSignElement.getParentNode() /* signature will be added as sibling to the element being signed */);
        dsc.setIdAttributeNS(toSignElement, null, "Id");
        XMLSignature signature = sigFac.newXMLSignature(si, null);
        signature.sign(dsc);

        // Return XMLSignature
        return signature;
    }

    // This method returns a hardcoded dummy private key used to simulate signatures using Java (see usages above)
    private PrivateKey getDummyPrivateKey() throws NoSuchAlgorithmException, InvalidKeySpecException {
        String privateKeyBase64 = "MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAIzrH1f5nzfbvvNHub6C1KvigS8CHHS/By5Ls4VTxQLOn9is+5cbKSD2iAfWT6vVAUSPv8TfhmvnpRqPJ4Bk3vrrVX5mdNuDoTzCQSbD/5iennFl4l+lemmu2Nudar1juEfxQfvFG2hvm8GQ/5u76w/iPREO8g7PzioKQRNZGOv/AgMBAAECgYAGq4JaSahtnmsVXMm/6LVkRV5T+Uebhwcx+8dNgj+K+Hi8asOlzVVPCBw8MrqmqXhb5GnxSZs1NEuuTCRUgXHEYI1nX289FI8sazIOu9UxxjfxvbED0d1y6dK4NWPOUFe/1fxZTgXSJXEOJ8cReI4/UpG8f76o9Tf7M5dj8t/rEQJBANbLA79N9jVoUZ+BvH6ryhxsrU8/0kXy+DippFpQsNcUPfz4TE9CjqH6u7t8RrmVXUp3JsMWm/fWWlQNwsJCFBsCQQCn8/SPKyUIjFsDLtU8QVpbwoW6TpRl3IwYdq6WdAdBXt29zfPtaz2OpNow2jaBSP+bJuEYmDabz4DZza3Sw93tAkEAyYhUbMPGllfZ9fJxnNys1zy05B26urz9X5T0S3VYZ4VroBaM6vVFBQBP8trpNSnLDZp8eSGWl9S8jg8XRNNhLwJAbew3+uAFC/Q4uPuU6ivnxLiqp4Y4j/Zp5rT+jVABU6KQRGKgLJqMnmh8uY6IL9OkH1qx5lPxIccMkQCRrKku/QJAA68E7uSQqOv8QayMebQrAIlHc/T6gePrwMr/e+b5aXQgSiTrcyB1C1zPnNZb/zd4ErrM7/4y2JiZ3ksk1I/SSg==";
        PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(privateKeyBase64));
        PrivateKey privateKey = KeyFactory.getInstance("RSA").generatePrivate(privateKeySpec);
        return privateKey;
    }

    // This method takes a XMLSignature and outputs the "to sign hash" encoded in Base64
    private String getToSignHashBase64(XMLSignature sig) throws IOException, NoSuchAlgorithmException {

        // Extract the "to sign data"
        byte[] toSignData = IOUtils.toByteArray(sig.getSignedInfo().getCanonicalizedData());

        // Compute the digest of the "to sign data" (called the "to sign hash")
        byte[] toSignHash = MessageDigest.getInstance("SHA-1").digest(toSignData);

        // Convert to Base64
        return Base64.getEncoder().encodeToString(toSignHash);
    }

    private void replaceSignatureElements(Document doc, String certificateBase64, String signatureBase64) {

        // Locate the last Signature element in the document
        NodeList sigElementsList = doc.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature");
        Element signatureElement = (Element)sigElementsList.item(sigElementsList.getLength() - 1);

        // Set actual signature value computed with Web PKI on the page
        Element signatureValueElement = (Element)signatureElement.getElementsByTagNameNS(XMLSignature.XMLNS, "SignatureValue").item(0);
        signatureValueElement.setTextContent(signatureBase64);

        // Add the X509Certificate containing the encoded certificate acquired with Web PKI on the page
        Element keyInfo = createKeyInfo(doc, certificateBase64);
        signatureElement.appendChild(keyInfo);
    }

    // This method encodes a XML document
    private byte[] encodeXml(Document doc) throws TransformerException, IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        TransformerFactory.newInstance().newTransformer().transform(new DOMSource(doc), new StreamResult(buffer));
        return buffer.toByteArray();
    }

    private Element createKeyInfo(Document doc, String certificateBase64) {

        Element x509Certificate = doc.createElementNS(XMLSignature.XMLNS, "X509Certificate");
        x509Certificate.setTextContent(certificateBase64);

        Element x509Data = doc.createElementNS(XMLSignature.XMLNS, "X509Data");
        x509Data.appendChild(x509Certificate);

        Element keyInfo = doc.createElementNS(XMLSignature.XMLNS, "KeyInfo");
        keyInfo.appendChild(x509Data);

        return keyInfo;
    }

}
