using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SampleSite.Controllers {

	/**
	 * The Basic RSA sample has frontend code only. See file RSA/Index.cshtml
	 */
    public class RSAController : Controller {

        public ActionResult Index() {
            return View();
        }
    }
}
