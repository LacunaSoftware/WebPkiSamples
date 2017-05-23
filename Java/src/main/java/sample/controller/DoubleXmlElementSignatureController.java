package sample.controller;

import org.apache.commons.io.IOUtils;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
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

@Controller
public class DoubleXmlElementSignatureController {

    @RequestMapping(value = "/double-xml-element-signature", method = {RequestMethod.GET})
    public String get(
            Model model,
            HttpServletResponse response
    ) throws Exception {

        // Open the XML to be signed
        Document doc = openXml(Util.getSampleLoteRps());

        // Sign the "InfRps" element using a dummy key
        XMLSignature sig = signWithDummyKey(doc, "InfRps");

        // Extract the "to sign data"
        byte[] toSignData = IOUtils.toByteArray(sig.getSignedInfo().getCanonicalizedData());

        // Compute the digest of the "to sign data" (called the "to sign hash")
        byte[] toSignHash = MessageDigest.getInstance("SHA-1").digest(toSignData);

        // Render the signature page with the "to sign hash" in a hidden field
        model.addAttribute("toSignHash", Base64.getEncoder().encodeToString(toSignHash));
        return "double-xml-element-signature-infrps";
    }

    @RequestMapping(value = "/double-xml-element-signature", method = {RequestMethod.POST})
    public String postElement(
            @RequestParam(value = "certificate", required = true) String certificateBase64,
            @RequestParam(value = "signature", required = true) String signatureBase64,
            @RequestParam(value = "certThumb", required = true) String certThumb,
            Model model,
            HttpServletResponse response
    ) throws Exception {

        // Open the XML to be signed
        Document doc = openXml(Util.getSampleLoteRps());

        // Sign the "InfRps" element using a dummy key
        signWithDummyKey(doc, "InfRps");

        // Add the X509Certificate containing the encoded certificate acquired with Web PKI on the page
        NodeList sigElementsList = doc.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature");
        Element signatureElement = (Element)sigElementsList.item(sigElementsList.getLength() - 1);
        Element keyInfo = createKeyInfo(doc, certificateBase64);
        signatureElement.appendChild(keyInfo);

        // Set actual signature value computed with Web PKI on the page
        NodeList sigValueList = signatureElement.getElementsByTagNameNS(XMLSignature.XMLNS, "SignatureValue");
        Element signatureValue = (Element)sigValueList.item(sigElementsList.getLength() - 1);
        signatureValue.setTextContent(signatureBase64);

        // Encode the signed XML
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        TransformerFactory.newInstance().newTransformer().transform(new DOMSource(doc), new StreamResult(buffer));
        byte[] signedXml = buffer.toByteArray();

        // Save the signed XML
        String filename = UUID.randomUUID() + ".xml";
        Files.write(Application.getTempFolderPath().resolve(filename), signedXml);

        // Open the signed XML to be signed again
        Document xmlDoc = openXml(signedXml);

        // Sign the "LoteRps" element using a dummy key
        XMLSignature sig = signWithDummyKey(xmlDoc, "LoteRps");

        // Extract the "to sign data"
        byte[] toSignData = IOUtils.toByteArray(sig.getSignedInfo().getCanonicalizedData());

        // Compute the digest of the "to sign data" (called the "to sign hash")
        byte[] toSignHash = MessageDigest.getInstance("SHA-1").digest(toSignData);

        // Render the signature page with the following parameters in hidden fields:
        // - toSignHash: "to sign hash"
        // - filename: The signed XML name
        // - certificate: Certificate content
        // - certThumb: Certificate thumbprint
        model.addAttribute("toSignHash", Base64.getEncoder().encodeToString(toSignHash));
        model.addAttribute("filename", filename);
        model.addAttribute("certificate", certificateBase64);
        model.addAttribute("certThumb", certThumb);
        return "double-xml-element-signature-loterps";
    }

    @RequestMapping(value = "/double-xml-element-signature-loterps", method = {RequestMethod.POST})
    public String postSecondElement(
            @RequestParam(value = "certificate", required = true) String certificateBase64,
            @RequestParam(value = "signature", required = true) String signatureBase64,
            @RequestParam(value = "filename", required = true) String filename,
            Model model,
            HttpServletResponse response
    ) throws Exception {

        // Open the XML to be signed
        byte[] xmlContent = Files.readAllBytes(Application.getTempFolderPath().resolve(filename));
        Document doc = openXml(xmlContent);

        // Sign the "LoteRps" element using a dummy key
        signWithDummyKey(doc, "LoteRps");

        // Add the X509Certificate containing the encoded certificate acquired with Web PKI on the page
        NodeList sigElementsList = doc.getElementsByTagNameNS(XMLSignature.XMLNS, "Signature");
        Element signatureElement = (Element)sigElementsList.item(sigElementsList.getLength() - 1);
        Element keyInfo = createKeyInfo(doc, certificateBase64);
        signatureElement.appendChild(keyInfo);

        // Set actual signature value computed with Web PKI on the page
        NodeList sigValueList = signatureElement.getElementsByTagNameNS(XMLSignature.XMLNS, "SignatureValue");
        Element signatureValue = (Element)sigValueList.item(sigValueList.getLength() - 1);
        signatureValue.setTextContent(signatureBase64);

        // Encode the signed XML
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        TransformerFactory.newInstance().newTransformer().transform(new DOMSource(doc), new StreamResult(buffer));
        byte[] signedXml = buffer.toByteArray();

        // Save the signed XML
        String newFilename = UUID.randomUUID() + ".xml";
        Files.write(Application.getTempFolderPath().resolve(newFilename), signedXml);

        model.addAttribute("filename", newFilename);
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
