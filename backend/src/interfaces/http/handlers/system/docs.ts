export const handler = async (event: any) => {
    const host = event.headers?.Host || event.headers?.host || "";
    const stage = event.requestContext?.stage || "";
    const basePath = stage && stage !== "$default" ? `/${stage}` : "";
    const specUrl = `https://${host}${basePath}/docs/spec`;

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Spotify Clone API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "${specUrl}",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      deepLinking: true,
    });
  </script>
</body>
</html>`;

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
        },
        isBase64Encoded: false,
        body: html,
    };
};
