using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.security;
using Org.BouncyCastle.X509;
using SampleSite.Classes;
using SampleSite.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SampleSite.Controllers {

	/**
	 * This controller shows how to digitally sign a PDF using the Web PKI component on the frontend together
	 * with the iTextSharp library on the backend.
	 * 
	 * This sample is adapted from iText's handbook "Digital Signatures for PDF Documents", chapter 4 ("Creating
	 * signatures externally"), section 4.3.3 ("Signing a document on the server using a signature created on the
	 * client"). This document is available on the URL below (after filling out some information):
	 * 
	 * http://pages.itextpdf.com/ebook-digital-signatures-for-pdf.html
	 * 
	 * 
	 * Notes on usage of iTextSharp (PLEASE READ THIS)
	 * ===============================================
	 * 
	 * This sample is provided "as is". WE DO NOT PROVIDE FREE SUPPORT ON THE USAGE OF ITEXTSHARP. Please do not contact
	 * us regarding problems on the usage of iTextSharp, except for problems strictly regarding integration with Web PKI.
	 *
	 * The iTextSharp library is a general purpose PDF library. Its usage for cryptographic operations on PDFs such as
	 * signing and timestamping is far from ideal. Implementing remote signatures (i.e. signing with a frontend component
	 * such as Web PKI) is particularly troublesome. To deal with this, this sample uses the Session object to store an
	 * iTextSharp object instance between requests. Please notice that this has very serious implications if you intend
	 * to develop a web application that can be executed simulteneously on multiple servers.
	 * 
	 * The iTextSharp library is not free. You must either purchase it or use it under the AGPLv3 license, in which case
	 * your web application must also be licensed under it, which means your web application must be open source (among
	 * other implications).
	 * 
	 * 
	 * Recommended alternatives to iTextSharp
	 * ======================================
	 * 
	 * In order to perform PDF signatures with Web PKI, we HIGHLY RECOMMEND using one of Lacuna Software's backend solutions:
	 * 
	 * - Rest PKI (https://pki.rest/), a cloud-based service to perform digital signatures in virtually any programming language.
	 *	  Usage through native libraries for Java, PHP, .NET, Python, NodeJS and Ruby. Can also be hosted "on premises".
	 *	  
	 *	  . Please notice that when using Web PKI together with the Rest PKI cloud service, it is not necessary to purchase a
	 *	    license for Web PKI, the cost for using it is embedded in the service transaction price.
	 *	    
	 *	- PKI SDK (https://www.lacunasoftware.com/en/products/pki_sdk), a .NET library specific for digital signatures
	 */
	public class ITextController : Controller {

		private const string DigestAlgorithm = "SHA256";


		[HttpGet]
		public ActionResult Index() {
			return View();
		}

		/**
		 * GET /IText/Start
		 * 
		 * This action renders the signature view.
		 */
		[HttpGet]
		public ActionResult Start() {
			return View();
		}

		/**
		 * POST /IText/Start
		 * 
		 * This action receives the encoding of the certificate chosen by the user to perform the signature
		 * and computes the "to-sign-hash", the actual bytes that need to be signed using the certificate's
		 * private key on the frontend.
		 * 
		 * This is what the iText digital signatures handbook calls the "pre-signing" step.
		 */
		[HttpPost]
		public ActionResult Start(SignatureStartModel model) {

			byte[] toSignHash, rangeDigest;
			PdfSignatureAppearance sigAppearance;
			MemoryStream signedPdfStream;

			try {

				// Decode Certificate
				var certificate = new X509CertificateParser().ReadCertificate(model.CertContent);

				// Create a PdfReader with the PDF that will be signed
				var reader = new PdfReader(Storage.GetSampleDocContent() /* here we're using a sample document */);

				// Open the Signed PDF stream and create a pdf stamper.
				signedPdfStream = new MemoryStream();
				var stamper = PdfStamper.CreateSignature(reader, signedPdfStream, '\0');

				// Create the signature appearance
				sigAppearance = stamper.SignatureAppearance;
				// Add a crypto dictionary to the signature appearance
				sigAppearance.CryptoDictionary = new PdfSignature(PdfName.ADOBE_PPKLITE, PdfName.ADBE_PKCS7_DETACHED);
				// Inform the pkcs7 padded max size, which is 8kb
				var exc = new Dictionary<PdfName, int>();
				exc.Add(PdfName.CONTENTS, 8192 * 2 + 2);
				// Preclose the signature apperance, only closing it after the signature is computed
				// (see the Complete method below)
				sigAppearance.PreClose(exc);

				// Compute the digests to be signed
				var pkcs7 = new PdfPKCS7(null, new X509Certificate[] { certificate }, DigestAlgorithm, false);
				using (var data = sigAppearance.GetRangeStream()) {
					// Compute the Range Digest
					rangeDigest = DigestAlgorithms.Digest(data, DigestAlgorithm);
					// Compute the toSignHash
					var authAttributes = pkcs7.getAuthenticatedAttributeBytes(rangeDigest, null, null, CryptoStandard.CMS);
					using (var ms = new MemoryStream(authAttributes)) {
						toSignHash = DigestAlgorithms.Digest(ms, DigestAlgorithm);
					}
				}

			} catch (Exception ex) {
				ModelState.AddModelError("", ex.ToString());
				return View();
			}

			// On the next step (Complete action), we'll need once again some information:
			// - The thumbprint of the selected certificate
			// - The content of the selected certificate used to validate the signature in complete action.
			// - The "to-sign-hash"
			// - The digest algorithm
			// We'll store these values on TempData, which is a temporary dictionary shared between actions during a redirect.
			TempData["SignatureCompleteModel"] = new SignatureCompleteModel() {
				CertThumb = model.CertThumb,
				CertContent = model.CertContent,
				ToSignHash = toSignHash,
				DigestAlgorithm = DigestAlgorithm
			};

			// During the "post-signing" step (see method Complete(SignatureCompleteModel) below), iTextSharp requires references
			// to the same objects rangeDigest, sigAppearance and signedPdfStream used during this step. This means we have to
			// use the Session object to store these objects.
			//
			// Please notice that this has very serious implications if you intend to develop a web application that can be executed
			// simulteneously on multiple servers. Tipically, in such cases, uses of the Session object to store data between requests
			// are replaced by storing the data on a database or filesystem shared between the servers. However, since the objects
			// sigAppearance and signedPdfStream are complex, non-serializable objects, such strategy would not apply!
			Session.Add("ITextSessionModel", new ITextSessionModel() {
				RangeDigest = rangeDigest,
				SignatureApperance = sigAppearance,
				SignedPdfStream = signedPdfStream
			});
			// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
			// !!! WARNING: USING SESSION TO STORE COMPLEX, NON-SERIALIZABLE OBJECTS !!!
			//
			// (please see comments on the beggining on this file for alternatives)

			return RedirectToAction("Complete");
		}

		/**
		 * GET IText/Complete
		 * 
		 * The user is redirected to this action from the Index action. This action renders the
		 * "Complete" view which performs the actual signature using Web PKI
		 */
		[HttpGet]
		public ActionResult Complete() {

			// Recover data from before the redirect. This data is used on the signature using the Web PKI component.
			var model = TempData["SignatureCompleteModel"] as SignatureCompleteModel;
			if (model == null) {
				// The user manually accessed the action, this is not supported
				return RedirectToAction("Index");
			}

			// Render the "Complete" view which uses the signature parameters computed previously
			// to perform the actual signature computation using the certificate's private key using Web PKI
			return View(model);
		}

		/**
		 * POST IText/Complete
		 * 
		 * This action receives the result of the signature algorithm computation, performed with Web PKI on the frontend,
		 * and composes the PDF signature with iTextSharp with this data.
		 */
		[HttpPost]
		public ActionResult Complete(SignatureCompleteModel model) {

			byte[] signedPdf;

			try {

				// Recover session data from Index action
				var sessionModel = Session["ITextSessionModel"] as ITextSessionModel;
				if (sessionModel == null) {
					// This should not happen
					return RedirectToAction("Index");
				}

				// Decode Certificate
				var certificate = new X509CertificateParser().ReadCertificate(model.CertContent);

				// Compute the external digest
				var pkcs7 = new PdfPKCS7(null, new X509Certificate[] { certificate }, DigestAlgorithm, false);
				pkcs7.SetExternalDigest(model.Signature, null, "RSA");

				// Get a padded PKCS#7
				byte[] pkcs7Encoded = pkcs7.GetEncodedPKCS7(sessionModel.RangeDigest);
				if (pkcs7Encoded.Length > 8192) { // It shouldn't happen
					throw new InvalidOperationException("PKCS37 encoded shouldn't be bigger than the space reserved for it");
				}
				byte[] pkcs7Padded = new byte[8192];
				pkcs7Encoded.CopyTo(pkcs7Padded, 0);

				// Instanciate a PDF dictionary
				var sigDictionary = new PdfDictionary();
				// Write the PKCS#7 padded on the signature dictionary
				sigDictionary.Put(PdfName.CONTENTS, new PdfString(pkcs7Padded).SetHexWriting(true));
				// Finally, close the PDF appearance to finish the signature process
				sessionModel.SignatureApperance.Close(sigDictionary);

				// Receive the signed PDF bytes from the its stream, which was storage by the session variable
				signedPdf = sessionModel.SignedPdfStream.ToArray();

				// Close the signed PDF stream
				sessionModel.SignedPdfStream.Close();

			} catch (Exception ex) {

				ModelState.AddModelError("", ex.ToString());
				return View();

			} finally {
				// Clear the object stored on the Session
				Session.Remove("SignatureCompleteModel");
			}

			TempData["SignatureInfoModel"] = new SignatureInfoModel() {
				File = Storage.StoreFile(signedPdf, ".pdf")
			};

			return RedirectToAction("SignatureInfo");
		}

		[HttpGet]
		public ActionResult SignatureInfo() {

			var model = TempData["SignatureInfoModel"] as SignatureInfoModel;
			if (model == null) {
				return RedirectToAction("Index");
			}

			return View(model);
		}
	}
}
