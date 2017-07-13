using SampleSite.Classes;
using SampleSite.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Web;
using System.Web.Mvc;
using System.Xml;

// If you get a build error on the line below, make sure your application is including the .NET assembly
// System.Security (Add Reference... > Assemblies > Framework > check "System.Security")
using System.Security.Cryptography.Xml;

namespace SampleSite.Controllers {
    public class XmlElementSignatureController : Controller {

        private const string DigestAlgorithm = "SHA1";

        // GET: XmlElementSignature
        [HttpGet]
        public ActionResult Index() {

            var xmlDoc = openXml();
            var xmlSig = prepareXmlSignature(xmlDoc);

            HashSignatureNotSetException hashSignatureNotSetException = null;
            try {
                xmlSig.ComputeSignature();
            } catch (HashSignatureNotSetException ex) {
                hashSignatureNotSetException = ex;
            }

            var toSignHash = hashSignatureNotSetException.ToSignHash;

            return View(new XmlSignatureModel() {
                ToSignHash = toSignHash,
                DigestAlgorithm = DigestAlgorithm
            });
        }

        [HttpPost]
        public ActionResult Index(XmlSignatureModel model) {

            var xmlDoc = openXml();
            var xmlSig = prepareXmlSignature(xmlDoc, model.Signature);

            var keyInfo = new KeyInfo();
            var x509Data = new KeyInfoX509Data();
            x509Data.AddCertificate(new X509Certificate(model.CertContent));
            keyInfo.AddClause(x509Data);
            xmlSig.KeyInfo = keyInfo;

            xmlSig.ComputeSignature();

            var signatureElement = xmlSig.GetXml();
            xmlDoc.DocumentElement.AppendChild(signatureElement);

            // Store signed xml
            string fileId = null;
            using (var outStream = Storage.CreateFile(".xml", out fileId)) {
                xmlDoc.Save(outStream);
            }

            return RedirectToAction("SignatureInfo", new SignatureInfoModel() {
                File = fileId
            });
        }

        [HttpGet]
        public ActionResult SignatureInfo(SignatureInfoModel model) {
            return View(model);
        }

        private static XmlDocument openXml() {

            var xmlDoc = new XmlDocument() {
                PreserveWhitespace = true
            };

            using (var stream = new MemoryStream(Storage.GetSampleNFeContent())) {
                xmlDoc.Load(stream);
            }

            return xmlDoc;
        }

        private static SignedXml prepareXmlSignature(XmlDocument xmlDoc, byte[] precomputedSignature = null) {

            var rsaMock = new RSAMock(2048 /* probable signer key size in bits */, 20 /* size in bytes of the output of the digest algorithm used in the signature (SHA-1) */);
            if (precomputedSignature != null) {
                rsaMock.SetPrecomputedSignature(precomputedSignature);
            }


            var xmlSig = new SignedXml(xmlDoc) {
                SigningKey = rsaMock
            };
            xmlSig.SignedInfo.SignatureMethod = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
            var reference = new Reference() {
                Uri = "#NFe35141214314050000662550010001084271182362300",
                DigestMethod = "http://www.w3.org/2000/09/xmldsig#sha1"
            };
            reference.AddTransform(new XmlDsigEnvelopedSignatureTransform());
            reference.AddTransform(new XmlDsigC14NTransform(false));
            xmlSig.AddReference(reference);
            return xmlSig;
        }

        class RSAMock : RSA {

            private int keySize;
            private int toSignHashSize;
            private byte[] precomputedToSignHash;
            private byte[] precomputedSignature;

            public RSAMock(int keySize, int toSignHashSize) {
                this.keySize = keySize;
                this.toSignHashSize = toSignHashSize;
            }

            public void SetPrecomputedSignature(byte[] signature, byte[] toSignHash = null) {
                precomputedSignature = signature;
                precomputedToSignHash = toSignHash;
            }

            public override int KeySize {
                get {
                    return keySize;
                }
            }

            public override string SignatureAlgorithm {
                get {
                    throw new NotImplementedException();
                }
            }

            public override string KeyExchangeAlgorithm {
                get {
                    throw new NotImplementedException();
                }
            }

            public override byte[] DecryptValue(byte[] rgb) {

                var toSignHash = new byte[toSignHashSize];
                Array.Copy(rgb, rgb.Length - toSignHashSize, toSignHash, 0, toSignHashSize);

                if (precomputedSignature == null) {
                    throw new HashSignatureNotSetException(toSignHash);
                }

                if (precomputedToSignHash != null && !precomputedToSignHash.SequenceEqual(toSignHash)) {
                    throw new InvalidOperationException("The given precomputed signature was done on a different hash");
                }

                return precomputedSignature;
            }

            public override byte[] EncryptValue(byte[] rgb) {
                throw new NotImplementedException();
            }

            public override RSAParameters ExportParameters(bool includePrivateParameters) {
                throw new NotSupportedException();
            }

            public override void ImportParameters(RSAParameters parameters) {
                throw new NotImplementedException();
            }
        }

        class HashSignatureNotSetException : Exception {

            public byte[] ToSignHash { get; private set; }

            public HashSignatureNotSetException(byte[] toSignHash) : base("The result of the signature operation is not known at this point") {
                this.ToSignHash = toSignHash;
            }
        }
    }
}
