package sample.util;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import sample.Application;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.UUID;

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

    // The methods StoreFile and RecoverFile simulate a local storage. In your application, this could be your
    // database.
    public static String StoreFile(byte[] content, String extension) throws IOException {
        String filename = UUID.randomUUID() + extension;
        Files.write(Application.getTempFolderPath().resolve(filename), content);
        return filename;
    }
    public static byte[] RecoverFile(String filename) throws IOException {
        return Files.readAllBytes(Application.getTempFolderPath().resolve(filename));
    }
}
