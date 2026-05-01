using Yarp.ReverseProxy.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add YARP reverse proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "gateway" }));

app.UseRouting();
app.UseEndpoints(endpoints =>
{
    endpoints.MapReverseProxy();
});

app.Run();
