using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SampleSite.Controllers {
    public class BasicSampleController : Controller {

        // GET: BasicSample
        public ActionResult Index() {
            return View();
        }
    }
}