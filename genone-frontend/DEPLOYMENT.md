# Deployment Configuration

## Environment Variables

This application uses environment-specific configuration through `.env` files:

- **Development**: `.env` - Uses full URLs with localhost
- **Production**: `.env.production` - Uses relative URLs for deployment flexibility

## Production Configuration

The production build uses **relative URLs** which means:
- The frontend automatically uses the same domain it's served from
- No need to update URLs when deploying to different domains
- Works with any reverse proxy or CDN setup

### Example Production URLs:
```
VITE_LANGGRAPH_API_URL=
VITE_API_BASE_URL=/api/v1
```

When deployed to `https://genone.partners.one.nz`:
- API calls go to `https://genone.partners.one.nz/api/v1/*`
- No CORS issues since frontend and backend share the same origin

## Deployment Steps

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your web server

3. **Configure your web server** (nginx/Apache) to:
   - Serve the frontend from root (`/`)
   - Proxy API requests from `/api/v1/*` to your backend service
   - Handle client-side routing (redirect all routes to index.html)

## Benefits of This Approach

- ✅ One build works on any domain
- ✅ No hardcoded URLs in production
- ✅ Automatic HTTPS/HTTP detection
- ✅ Easy staging/production deployments
- ✅ No CORS configuration needed

## Testing Production Build Locally

```bash
npm run build
npm run preview
```

This serves the production build on `http://localhost:3000`