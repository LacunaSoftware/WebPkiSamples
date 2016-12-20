Web PKI Java Sample
===================

This folder contains a web application written in Java that shows how to use the
[Web PKI component](https://webpki.lacunasoftware.com/).

For other languages, please visit the [repository root](https://github.com/LacunaSoftware/WebPkiSamples).

You can run the sample without any license as long as the web application is running localhost. In order to run the project
outside of localhost, you'll need a license for the Web PKI component. If you don't have one, [request a free trial license](https://webpki.lacunasoftware.com/#/Contact/GetTrial).

If you need test certificates for development or staging environments, [click here](https://github.com/LacunaSoftware/WebPkiSamples#test-certificates).

Running the project
-------------------

To run the project:

1. [Download the project](https://github.com/LacunaSoftware/WebPkiSamples/archive/master.zip)
   or clone the repository

2. In a command prompt, navigate to the folder `Java` and run the command
   `gradlew run` (on Linux `./gradlew run`). If you are using Windows, you can alternatively
   double-click the file `Run-Sample.bat`.
 
3. Once you see the message "Started Application in x.xxx seconds" (the on-screen percentage
   will *not* reach 100%), open a web browser and go the URL [http://localhost:8080/](http://localhost:8080/)
   

Running the project using Maven instead of Gradle
-------------------------------------------------

If you prefer Maven over Gradle, follow the same steps as above but on step 2 instead of the gradle command execute `mvn spring-boot:run`
   

Opening the project on Eclipse or IDEA
--------------------------------------

To open the project on Eclipse, run `gradlew eclipse` on the `Java` folder and then
then import the project from Eclipse.

To open the project on IntelliJ IDEA, run `gradlew idea` on the `Java` folder
and then use the "Open" funcionality inside IDEA (works better than "Import").

