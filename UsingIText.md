Using Web PKI with iText to digitally sign PDFs
===============================================

We have samples showing how to digitally sign a PDF using the Web PKI component on the frontend together
with the iText library on the backend in the following programming languages:

* C# -- see the project [README](CSharp/) or the [ITextController](CSharp/MVC/SampleSite/Controllers/ITextController.cs)
* ~~Java~~ (coming soon)


Notes on usage of iText (PLEASE READ THIS)
------------------------------------------

This sample is provided "as is". **WE DO NOT PROVIDE FREE SUPPORT ON THE USAGE OF ITEXT**. Please do not contact
us regarding problems on the usage of iText, except for problems strictly regarding integration with Web PKI.

The iText library is a general purpose PDF library. Its usage for cryptographic operations on PDFs such as
signing and timestamping is far from ideal. Implementing remote signatures (i.e. signing with a frontend component
such as Web PKI) is particularly troublesome. To deal with this, this sample uses the Session object to store an
iText object instance between requests. Please notice that this has very serious implications if you intend
to develop a web application that can be executed simulteneously on multiple servers.

The iText library is not free. You must either purchase it or use it under the AGPLv3 license, in which case
your web application must also be licensed under it, which means your web application must be open source (among
other implications).


Recommended alternatives to iText
---------------------------------

In order to perform PDF signatures with Web PKI, we HIGHLY RECOMMEND using one of Lacuna Software's backend solutions:

- [Rest PKI](https://pki.rest/), a cloud-based service to perform digital signatures in virtually any programming language. Usage through native libraries for Java, PHP, .NET, Python, NodeJS and Ruby. Can also be hosted "on premises".
  - Please notice that when using Web PKI together with the Rest PKI cloud service, it is not necessary to purchase a license for Web PKI, the cost for using it is embedded in the service transaction price.
- [PKI SDK](https://www.lacunasoftware.com/en/products/pki_sdk), a .NET library specific for digital signatures


See also
--------

* [Rest PKI samples on GitHub](https://github.com/LacunaSoftware/RestPkiSamples)
* [PKI SDK samples on GitHub](https://github.com/LacunaSoftware/PkiSdkSamples)
