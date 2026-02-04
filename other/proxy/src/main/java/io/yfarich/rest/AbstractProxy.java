package io.yfarich.rest;

import com.sun.jersey.api.client.ClientHandlerException;
import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

public abstract class AbstractProxy {

  @GET
  @Path("/{param}/{param2}/{param3}/{param4}")
  public Response getMsgAsHTML(@PathParam("param") String param,
      @PathParam("param2") String param2,
      @PathParam("param3") String param3,
      @PathParam("param4") String param4,
      @Context ServletContext servletContext) {
    return getMsgAsHTML(param + "/" + param2, param3, param4, servletContext);
  }

  @GET
  @Path("/{param}/{param2}/{param3}")
  public Response getMsgAsHTML(@PathParam("param") String param,
      @PathParam("param2") String param2,
      @PathParam("param3") String param3,
      @Context ServletContext servletContext) {
    return getMsgAsHTML(param + "/" + param2, param3, servletContext);
  }

  @GET
  @Path("/{param}/{param2}")
  public Response getMsgAsHTML(@PathParam("param") String param,
      @PathParam("param2") String param2,
      @Context ServletContext servletContext) {
    return getMsgAsHTML(param + "/" + param2, servletContext);
  }

  @GET
  @Path("/{param}")
  public Response getMsgAsHTML(@PathParam("param") String param,
      @Context ServletContext servletContext) {
    try {
      return sendGetRequest(param, servletContext);
    } catch (Exception e) {
      return handleException(e);
    }
  }

  protected abstract Response sendGetRequest(String param, ServletContext servletContext);

  @POST
  @Path("/{param}/{param2}/{param3}/{param4}")
  public Response postMsgAsHTML(
      @PathParam("param") String param,
      @PathParam("param2") String param2,
      @PathParam("param3") String param3,
      @PathParam("param4") String param4,
      String message,
      @Context ServletContext servletContext) {
    return postMsgAsHTML(param + "/" + param2, param3, param4, message, servletContext);
  }

  @POST
  @Path("/{param}/{param2}/{param3}")
  public Response postMsgAsHTML(
      @PathParam("param") String param,
      @PathParam("param2") String param2,
      @PathParam("param3") String param3,
      String message,
      @Context ServletContext servletContext) {
    return postMsgAsHTML(param + "/" + param2, param3, message, servletContext);
  }

  @POST
  @Path("/{param}/{param2}")
  public Response postMsgAsHTML(@PathParam("param") String param,
      @PathParam("param2") String param2,
      String message,
      @Context ServletContext servletContext) {
    return postMsgAsHTML(param + "/" + param2, message, servletContext);
  }

  @POST
  @Path("/{param}")
  public Response postMsgAsHTML(
      @PathParam("param") String param,
      String message,
      @Context ServletContext servletContext) {
    try {
      return sendPOSTRequest(param, message, servletContext);
    } catch (Exception e) {
      return handleException(e);
    }
  }

  protected abstract Response sendPOSTRequest(String param, String message,
      ServletContext servletContext);

  protected Response handleException(Exception e) {
    String errorMessage = e.getMessage();
    if (e instanceof ClientHandlerException) {
      ClientHandlerException clientHandlerException = (ClientHandlerException) e;
      errorMessage = String
          .format("Erreur de communication avec le serveur distant [%s] .",
              clientHandlerException.getMessage());
    }
    return Response
        .status(Status.INTERNAL_SERVER_ERROR)
        .entity(errorMessage)
        .build();
  }

}
