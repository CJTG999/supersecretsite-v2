package io.yfarich.rest;

import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientHandlerException;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.WebResource;
import javax.servlet.ServletContext;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

@Path("/html")
public class ProxyService extends AbstractProxy {

  private final String REMOTE_SERVER_URL = "http://localhost:3000";
  private final String CURRENT_BASE_HREF = "/jersey/proxy/html/";

  @Override
  public Response sendGetRequest(String param, ServletContext servletContext) {

    ClientResponse remoteServerResponse = getWebResource(param)
        .accept(MediaType.WILDCARD)
        .get(ClientResponse.class);

    return makeResponse(remoteServerResponse);
  }

  @Override
  public Response sendPOSTRequest(String param, String message, ServletContext servletContext) {

    ClientResponse remoteServerResponse = getWebResource(param)
        .accept(MediaType.WILDCARD)
        .header("Content-Type", "application/json;charset=utf-8")
        .post(ClientResponse.class, message);

    return makeResponse(remoteServerResponse);
  }

  private WebResource getWebResource(String url) {
    return Client
        .create()
        .resource(REMOTE_SERVER_URL + "/" + url);
  }

  private Response makeResponse(ClientResponse remoteServerResponse) {
    return Response
        .status(remoteServerResponse.getStatus())
        .entity(replaceBaseHref(remoteServerResponse.getEntity(String.class), CURRENT_BASE_HREF))
        .type(remoteServerResponse.getType())
        .build();
  }

  private String replaceBaseHref(String response, String baseHREF) {
    return response.replaceAll("<base href=\".*\">",
        "<base href=\"" + baseHREF + "\">");
  }
}