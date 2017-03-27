Certificate Properties
======================

The function `listCertificates()` returns an array of certificates. For each certificate, these are the properties available and their JavaScript types:

* `subjectName` (String) - The common name (CN) part of the subject name
* `issuerName` (String) - The common name (CN) part of the issuer name
* `thumbprint` (String) - Base64-encoded SHA-256 digest of the certificate's DER encoding (used to reference the certificate on other calls to Web PKI)
* `keyUsage` (Object) - Object with the following `Boolean` properties: `crlSign`, `dataEncipherment`, `decipherOnly`, `digitalSignature`, `encipherOnly`, `keyAgreement`, `keyCertSign`, `keyEncipherment`, `nonRepudiation`
* `validityStart` (Date) - The "not before" field of the certificate
* `validityEnd` (Date) - The "not after" field of the certificate
* `pkiBrazil` (Object) - Object containing the following ICP-Brasil-specific properties:
	* `cpf` (String) - Certificate holder's CPF (*CPF do titular/responsável*)
	* `cnpj` (String) - Company's CNPJ
	* `responsavel` (String) - Name of the certificate's holder (*nome do titular/responsável*)
	* `companyName` (String) - Company name
	* `dateOfBirth` (Date) - Certificate holder's date of birth
	* `certificateType` (String) - Type of the certificate (e.g.: "A1", "A3")
	* `isAplicacao` (Boolean) - Indicates whether the certificate is an application certificate
	* `isPessoaFisica` (Boolean) - Indicates whether the certificate is a "personal certificate" (*certificado de pessoa física*)
	* `isPessoaJuridica` (Boolean) - Indicates whether the certificate is an "enterprise certificate" (*certificado de pessoa jurídica*)
* `pkiItaly` (Object) - Object containing the following Italy-specific properties:
	* `codiceFiscale` (String) - The subject's fiscal code (*codice fiscale*)
