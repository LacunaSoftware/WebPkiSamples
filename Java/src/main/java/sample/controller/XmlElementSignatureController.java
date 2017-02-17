package sample.controller;

import org.apache.commons.io.IOUtils;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;
import sample.Application;
import sample.util.Util;

import javax.servlet.http.HttpServletResponse;
import javax.xml.crypto.MarshalException;
import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.security.*;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.*;

/*
 * This is the controller responsible for the XML element signature sample. It responds two
 * routes:
 *
 * GET /xml-element-signature  - initiates the signature and renders the signature page
 * POST /xml-element-signature - completes the signature with data received from the signature page
 */
@Controller
public class XmlElementSignatureController {

    /*
     * GET /xml-element-signature
     *
	 * This action initiates a XML element signature and renders the signature page.
	 */
    @RequestMapping(value = "/xml-element-signature", method = {RequestMethod.GET})
    public String get(
            Model model,
            HttpServletResponse response
    ) throws Exception {

        // Open the XML to be signed
        Document doc = openXml();

        // Sign the "infNFe" element using a dummy key in order to get the "to sign data", which is the byte array
        // that needs to be used as input to the signature algorithm to be performed with Web PKI
        XMLSignature sig = signWithDummyKey(doc);

        // Extract the "to sign data"
        byte[] toSignData = IOUtils.toByteArray(sig.getSignedInfo().getCanonicalizedData());

        // Compute the digest of the "to sign data" (called the "to sign hash")
        byte[] toSignHash = MessageDigest.getInstance("SHA-1").digest(toSignData);

        // Render the signature page with the "to sign hash" in a hidden field
        model.addAttribute("toSignHash", Base64.getEncoder().encodeToString(toSignHash));
        return "xml-element-signature";
    }

    /*
     * POST /xml-element-signature
     *
     * This action receives the encoding of the certificate chosen by the user and the result of the signature
     * algorithm, both acquired with Web PKI on the page, and composes the XML signature with this data
     */
    @RequestMapping(value = "/xml-element-signature", method = {RequestMethod.POST})
    public String postElement(
            @RequestParam(value = "certificate", required = true) String certificateBase64,
            @RequestParam(value = "signature", required = true) String signatureBase64,
            Model model,
            HttpServletResponse response
    ) throws Exception {

        // Open the XML to be signed
        Document doc = openXml();

        // Sign the "infNFe" element using a dummy key
        signWithDummyKey(doc);

        // Set actual signature value computed with Web PKI on the page
        Element signatureValue = (Element)doc.getElementsByTagNameNS(XMLSignature.XMLNS, "SignatureValue").item(0);
        signatureValue.setTextContent(signatureBase64);

        // Add the X509Certificate containing the encoded certificate acquired with Web PKI on the page
        Element signatureElement = (Element)doc.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature").item(0);
        Element keyInfo = createKeyInfo(doc, certificateBase64);
        signatureElement.appendChild(keyInfo);

        // Encode the signed XML
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        TransformerFactory.newInstance().newTransformer().transform(new DOMSource(doc), new StreamResult(buffer));
        byte[] signedXml = buffer.toByteArray();

        // Save the signed XML
        String filename = UUID.randomUUID() + ".xml";
        Files.write(Application.getTempFolderPath().resolve(filename), signedXml);

        model.addAttribute("filename", filename);
        return "xml-signature-info";
    }

    private Document openXml() throws IOException, SAXException, ParserConfigurationException {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        dbf.setNamespaceAware(true);
        DocumentBuilder builder = dbf.newDocumentBuilder();
        return builder.parse(new ByteArrayInputStream(Util.getSampleNFe()));
    }

    private XMLSignature signWithDummyKey(Document doc) throws InvalidAlgorithmParameterException, NoSuchAlgorithmException, InvalidKeySpecException, MarshalException, XMLSignatureException {

        XMLSignatureFactory sigFac = XMLSignatureFactory.getInstance("DOM");

        // Get the infNFe element and its ID
        Element toSignElement = (Element)doc.getElementsByTagNameNS("http://www.portalfiscal.inf.br/nfe", "infNFe").item(0);
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
