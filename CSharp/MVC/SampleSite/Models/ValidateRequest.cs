using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SampleSite.Models {
	public class ValidateRequest {
		public string OriginalMessage { get; set; }
		public byte[] SignedMessage { get; set; }
		public byte[] Certificate { get; set; }
	}
}
