using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Newtonsoft.Json.Serialization;

namespace SampleSite {
	public class MvcApplication : System.Web.HttpApplication {
		protected void Application_Start() {
			AreaRegistration.RegisterAllAreas();
			GlobalConfiguration.Configure(WebApiConfig.Register);
			FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
			RouteConfig.RegisterRoutes(RouteTable.Routes);
			BundleConfig.RegisterBundles(BundleTable.Bundles);
		}
	}


	public static class WebApiConfig {
		public static void Register(HttpConfiguration config) {
			// Web API configuration and services

			//Filters

			// Web API routes
			config.MapHttpAttributeRoutes();

			config.Routes.MapHttpRoute(
												 name: "DefaultApi",
												 routeTemplate: "api/{controller}/{id}",
												 defaults: new { id = RouteParameter.Optional }
												);

			config.Formatters.JsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
		}
	}
}
