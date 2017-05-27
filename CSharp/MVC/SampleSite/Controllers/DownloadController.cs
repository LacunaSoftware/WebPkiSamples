using SampleSite.Classes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace SampleSite.Controllers {
    public class DownloadController : Controller {

        // GET Download/File/{id}
        [HttpGet]
        public ActionResult File(string id) {
            if (string.IsNullOrEmpty(id)) {
                return HttpNotFound();
            }
            byte[] content;
            string extension;
            if (!Storage.TryGetFile(id, out content, out extension)) {
                return HttpNotFound();
            }
            var filename = id + extension;
            return File(content, MimeMapping.GetMimeMapping(filename), filename);
        }

        // GET Download/Sample
        [HttpGet]
        public ActionResult Sample() {
            var fileContent = Storage.GetSampleDocContent();
            return File(fileContent, "application/pdf", "Sample.pdf");
        }
    }
}