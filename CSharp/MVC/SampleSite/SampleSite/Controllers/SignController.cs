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
using SampleSite.Models;

namespace SampleSite.Controllers {

	public class SignController : ApiController {

		[HttpPost]
		public IHttpActionResult Validate(ValidateRequest request) {

			var data = Encoding.UTF8.GetBytes(request.OriginalMessage);

			byte[] hash;
			using (var sha256 = SHA256.Create()) {
				hash = sha256.ComputeHash(data);
			}

			var cert = new X509Certificate2(request.Certificate);
			var csp = (RSACryptoServiceProvider)cert.PublicKey.Key;
			var result = csp.VerifyHash(hash, "SHA256", request.SignedMessage);

			return Ok(result);
		}
	}
}
