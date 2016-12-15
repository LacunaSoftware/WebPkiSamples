package sample.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import sample.Application;
import sample.util.Util;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.util.UUID;

@Controller
public class XmlElementSignatureController {

    /*
	 * This action initiates a XML element signature using REST PKI and renders the signature page.
	 */
    @RequestMapping(value = "/xml-element-signature", method = {RequestMethod.GET})
    public String get(
            Model model,
            HttpServletResponse response
    ) throws IOException {
        return "xml-element-signature";
    }
}
