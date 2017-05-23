package sample.util;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class Util {

    public static byte[] getSampleNFe() throws IOException {
        return getResourceFile("/static/SampleNFe.xml");
    }

    public static byte[] getSampleLoteRps() throws IOException {
        return getResourceFile("/static/LoteRps.xml");
    }

    private static byte[] getResourceFile(String path) throws IOException {
        Resource resource = new ClassPathResource(path);
        InputStream fileStream = resource.getInputStream();
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        org.apache.commons.io.IOUtils.copy(fileStream, buffer);
        fileStream.close();
        buffer.flush();
        return buffer.toByteArray();
    }

}
