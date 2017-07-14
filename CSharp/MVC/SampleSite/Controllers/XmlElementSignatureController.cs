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

	/**
	 * This is the controller responsible for the XML element signature sample. It responds two
	 * routes:
	 * 
	 * GET /XmlElementSignature  - initiates the signature and renders the signature page
	 * POST /XmlElementSignature - completes the signature with data received from the signature page
	 * 
	 */
	public class XmlElementSignatureController : Controller {

		private const string DigestAlgorithm = "SHA1";

		/**
		 * GET /XmlElementSignature
		 * 
		 * This action initiates a XML element signature and renders the signature page.
		 */
		[HttpGet]
		public ActionResult Index() {

			// Open the XML to be signed
			var xmlDoc = openXml();

			// Prepare to sign the element with a "mock" RSA key which will throw a HashSignatureNotSetException exception with
			// the "to sign hash" when asked to perform the RSA signature algorithm
			var xmlSig = prepareXmlSignature(xmlDoc);

			// Call ComputeSignature(), which will result in a HashSignatureNotSetException being thrown with the "to sign hash"
			// computed by the .NET Framework
			HashSignatureNotSetException hashSignatureNotSetException = null;
			try {
				xmlSig.ComputeSignature();
			} catch (HashSignatureNotSetException ex) {
				hashSignatureNotSetException = ex;
			}
			var toSignHash = hashSignatureNotSetException.ToSignHash;

			// Render the signature page with the "to sign hash" on the model
			return View(new XmlSignatureModel() {
				ToSignHash = toSignHash,
				DigestAlgorithm = DigestAlgorithm
			});
		}

		/**
		 * POST /XmlElementSignature
		 * 
		 * This action receives the encoding of the certificate chosen by the user and the result of the signature
		 * algorithm, both acquired with Web PKI on the page, and composes the XML signature with this data
		 */
		[HttpPost]
		public ActionResult Index(XmlSignatureModel model) {

			// Open the XML to be signed
			var xmlDoc = openXml();

			// Prepare to sign the element with a "mock" RSA key which will respond to the RSA signature algorithm with the
			// signature computed on the frontend with Web PKI
			var xmlSig = prepareXmlSignature(xmlDoc, model.Signature);

			// Add a KeyInfo to the signature with the signer's certificate
			xmlSig.KeyInfo = getKeyInfo(new X509Certificate(model.CertContent));

			// Call ComputeSignature() (which will work this time because of the precomputed signature)
			xmlSig.ComputeSignature();

			// Add the signature element as a child of the root document (this might need to be altered to your needs!)
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
				PreserveWhitespace = true // This is needed to prevent .NET from trying to pretty-print the XML, which can break signatures
			};

			// Here we're using a sample XML, in your case this would probably come from the database or from a previous user upload
			using (var stream = new MemoryStream(Storage.GetSampleNFeContent())) {
				xmlDoc.Load(stream);
			}

			return xmlDoc;
		}

		private static SignedXml prepareXmlSignature(XmlDocument xmlDoc, byte[] precomputedSignature = null) {

			// Locate the element to be signed and get its ID
			var elementToSign = (XmlElement)xmlDoc.GetElementsByTagName("infNFe", "http://www.portalfiscal.inf.br/nfe")[0];
			var elementToSignId = elementToSign.GetAttribute("Id");

			// Instantiate a "mock" RSA key (see class RSAMock below). We need to give it the signer key size in bits (we're
			// guessing a 2048-bit key) and the size in bytes of the digest of the signature algorithm, which in this case
			// is 20 (SHA-1), since we'll use the SHA-1 with RSA signature algorithm.
			var rsaMock = new RSAMock(2048 /* guessing 2K key */, 20 /* SHA-1 output size */);

			// If we have a precomputed signature (computed with Web PKI on the frontend), pass it to the "mock" RSA key
			if (precomputedSignature != null) {
				rsaMock.SetPrecomputedSignature(precomputedSignature);
			}

			// Instantiate a SignedXml class with the "mock" RSA key
			var xmlSig = new SignedXml(xmlDoc) {
				SigningKey = rsaMock
			};

			// Set the signature method (SHA-1 with RSA)
			xmlSig.SignedInfo.SignatureMethod = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";

			// Reference the element to sign by its ID with:
			// - Digest algorithm: SHA-1
			// - Transformations: "Enveloped" and canonicalization (Canonical XML 1.0)
			var reference = new Reference() {
				Uri = "#" + elementToSignId,
				DigestMethod = "http://www.w3.org/2000/09/xmldsig#sha1"
			};
			reference.AddTransform(new XmlDsigEnvelopedSignatureTransform());
			reference.AddTransform(new XmlDsigC14NTransform(false));
			xmlSig.AddReference(reference);
			return xmlSig;
		}

		private static KeyInfo getKeyInfo(X509Certificate certificate) {
			var keyInfo = new KeyInfo();
			var x509Data = new KeyInfoX509Data();
			x509Data.AddCertificate(certificate);
			keyInfo.AddClause(x509Data);
			return keyInfo;
		}

		/**
		 * This is a "mock" RSA key whose behavior upon request by the SignedXml .NET class to perform a digital signature
		 * operation depends on whether we have a precomputed signature (computed with Web PKI on the frontend):
		 * 
		 * - If we don't, it will throw a HashSignatureNotSetException with the "to sign hash"
		 * - If we do, it will return the precomputed signature as the result of the signature operation
		 * 
		 * This class allows us to use the SignedXml class, which does not natively support remote signatures, to sign
		 * with a key that is available only on the frontend.
		 */
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
