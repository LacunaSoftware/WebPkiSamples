﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace SampleSite.Models {
    public class XmlSignatureModel {

        public byte[] CertContent { get; set; }
        public string CertContentBase64 {
            get {
                return CertContent != null ? Convert.ToBase64String(CertContent) : "";
            }
            set {
                CertContent = !string.IsNullOrEmpty(value) ? Convert.FromBase64String(value) : null;
            }
        }
        public byte[] ToSignHash { get; set; }
        public string ToSignHashBase64 {
            get {
                return ToSignHash != null ? Convert.ToBase64String(ToSignHash) : "";
            }
            set {
                ToSignHash = !string.IsNullOrEmpty(value) ? Convert.FromBase64String(value) : null;
            }
        }

        public byte[] Signature { get; set; }
        public string SignatureBase64 {
            get {
                return Signature != null ? Convert.ToBase64String(Signature) : "";
            }
            set {
                Signature = !string.IsNullOrEmpty(value) ? Convert.FromBase64String(value) : null;
            }
        }

        public string DigestAlgorithm { get; set; }
    }
}