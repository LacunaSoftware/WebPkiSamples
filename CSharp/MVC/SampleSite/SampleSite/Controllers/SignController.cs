using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Web.Http;

namespace SampleSite.Controllers {
	//[Route("api/sign")]
	public class SignController : ApiController {
		// GET api/<controller>
		public IEnumerable<string> Get() {
			return new string[] { "value1", "value2" };
		}

		// GET api/<controller>/5
		public string Validate2(string originalMessage, string signedMessage, string certificate) {
			return "X";
		}

		// POST api/<controller>
		//[FromBody]
//		[Route("api/sign/validate")]
		[HttpPost]
		public string Validate(ValidateRequest request) {
			return VerifyData(request.OriginalMessage, request.SignedMessage, request.Certificate).ToString();
		}

		//[HttpPost]
		//public string Post(string originalMessage, string signedMessage, string certificate) {
		//	return VerifyData(originalMessage, signedMessage, certificate).ToString();
		//}

		// PUT api/<controller>/5
		public void Put(int id, [FromBody]string value) {
		}

		// DELETE api/<controller>/5
		public void Delete(int id) {
		}

		public static bool VerifyData(string originalMessage, string signedMessage, string certificate) {
			byte[] data = Encoding.UTF8.GetBytes(originalMessage);
			byte[] signature = Convert.FromBase64String(signedMessage);
			byte[] certificateBytes = Convert.FromBase64String(certificate);
			byte[] hash;
			using (SHA256 sha256 = SHA256.Create()) {
				hash = sha256.ComputeHash(data);
			}

			var cert = new X509Certificate2(certificateBytes);
			var csp = (RSACryptoServiceProvider)cert.PublicKey.Key;
			return csp.VerifyHash(hash, CryptoConfig.MapNameToOID("SHA256"), signature);
		}



	}

	public class ValidateRequest {
		public string OriginalMessage { get; set; } 
		public string SignedMessage { get; set; } 
		public string Certificate { get; set; } 
	}
}