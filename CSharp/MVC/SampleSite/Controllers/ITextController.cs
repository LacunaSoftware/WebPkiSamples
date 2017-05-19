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
    public class ITextController : Controller {

        // GET: IText
        [HttpGet]
        public ActionResult Index() {
            return View();
        }

        [HttpPost]
        public ActionResult Index(SignatureStartModel model) {

            string digestAlgorithm = "SHA256";
            byte[] toSignHash, rangeDigest;
            PdfSignatureAppearance sigAppearance;
            MemoryStream signedPdfStream;

            try {

                // Decode Certificate
                var certificate = new X509CertificateParser().ReadCertificate(model.CertContent);

                // Set the sample PDF file
                var reader = new PdfReader(Storage.GetSampleDocContent());

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

                // Computed the digests to be signed
                var pkcs7 = new PdfPKCS7(null, new X509Certificate[] { certificate }, digestAlgorithm, false);
                using (var data = sigAppearance.GetRangeStream()) {
                    // Compute the Range Digest
                    rangeDigest = DigestAlgorithms.Digest(data, digestAlgorithm);
                    // Compute the toSignHash
                    var authAttributes = pkcs7.getAuthenticatedAttributeBytes(rangeDigest, null, null, CryptoStandard.CMS);
                    using (var ms = new MemoryStream(authAttributes)) {
                        toSignHash = DigestAlgorithms.Digest(ms, digestAlgorithm);
                    }
                }
                
            } catch (Exception ex) {
                ModelState.AddModelError("", ex.ToString());
                return View();
            }

            // Storage in a temporary dictionary all the infomation needed to be used on the signature
            // using Web PKI component (see Content/js/app/signature-complete-form.js)
            TempData["SignatureCompleteModel"] = new SignatureCompleteModel() {
                CertThumb = model.CertThumb,
                CertContent = model.CertContent,
                ToSignHash = toSignHash,
                DigestAlgorithm = digestAlgorithm
            };

            // Storage in session variable the information need for the iText signature
            // process. See the post method below.
            Session.Add("ITextSessionModel", new ITextSessionModel() {
                RangeDigest = rangeDigest,
                SignatureApperance = sigAppearance,
                SignedPdfStream = signedPdfStream
            });

            return RedirectToAction("Complete");
        }

        [HttpGet]
        public ActionResult Complete() {

            // Recovery data from Index action, if returns null, it'll be redirected to Index 
            // action again. This data is used on the signature using the Web PKI component.
            var model = TempData["SignatureCompleteModel"] as SignatureCompleteModel;
            if (model == null) {
                return RedirectToAction("Index");
            }

            return View(model);
        }

        [HttpPost]
        public ActionResult Complete(SignatureCompleteModel model) {

            byte[] signedPdf;

            try {

                // Recover session data from Index action, if returns null, it'll be redirected to
                // Index action again. This data is used to complete the iText signature process
                var sessionModel = Session["ITextSessionModel"] as ITextSessionModel;
                if (sessionModel == null) {
                    return RedirectToAction("Index");
                }

                // Decode Certificate
                var certificate = new X509CertificateParser().ReadCertificate(model.CertContent);

                // Compute the external digest
                var pkcs7 = new PdfPKCS7(null, new X509Certificate[] { certificate }, "SHA256", false);
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
                Session.Remove("SignatureCompleteModel");
            }

            TempData["SignatureInfoModel"] = new SignatureInfoModel() {
                File = Storage.StoreFile(signedPdf, ".pdf")
            };

            return RedirectToAction("SignatureInfo");
        }

        [HttpGet]
        public ActionResult SignatureInfo() {

            // Recovery data from Conplete action, if returns null, it'll be redirected to Index 
            // action again.
            var model = TempData["SignatureInfoModel"] as SignatureInfoModel;
            if (model == null) {
                return RedirectToAction("Index");
            }

            return View(model);
        }
    }
}