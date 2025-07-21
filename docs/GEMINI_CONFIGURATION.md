# Gemini API Configuration

This document explains how to configure the Gemini AI service for the AI Tools project.

## Overview

The Gemini service is used to generate high-quality FLUX Kontext prompts based on user input and optional image uploads. The service has been refactored to use environment variables for better security and flexibility.

## Environment Variables

### Required Variables

- `GEMINI_API_KEY`: Your Google Gemini API key
  - **Required**: Yes
  - **Example**: `AIzaSyCgxs1UF3qv0d2AFm9Opl1vwroYIlOzW1g`
  - **Security**: Keep this secret and never commit to version control

### Optional Variables

- `GEMINI_MODEL`: The Gemini model to use
  - **Required**: No
  - **Default**: `gemini-2.5-flash`
  - **Example**: `gemini-2.5-flash`, `gemini-pro`, etc.

## Configuration Steps

### 1. Update Environment Files

Add the following to your `.env` file:

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your-actual-gemini-api-key-here
GEMINI_MODEL=gemini-2.5-flash
```

### 2. Docker Deployment

The Docker Compose configuration automatically picks up these environment variables:

```yaml
environment:
  - GEMINI_API_KEY=${GEMINI_API_KEY}
  - GEMINI_MODEL=${GEMINI_MODEL:-gemini-2.5-flash}
```

### 3. Local Development

For local development, ensure your `.env` file is properly configured and run:

```bash
# Verify environment variables
./setup-env.sh verify

# Start the development server
cd backend
python run.py
```

## Getting a Gemini API Key

1. Visit the [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Navigate to "Get API Key"
4. Create a new API key
5. Copy the key and add it to your `.env` file

## Error Handling

The service includes proper error handling:

- **Missing API Key**: Service will fail to initialize with a clear error message
- **Invalid API Key**: API calls will fail with authentication errors
- **Network Issues**: API calls will timeout and return error responses

## Usage in Code

The service uses lazy initialization to avoid requiring environment variables at import time:

```python
from app.utils.gemini_service import get_gemini_service

# Get the service instance (initializes on first call)
gemini_service = get_gemini_service()

# Generate prompts
prompts = gemini_service.generate_flux_prompts(
    user_input="A beautiful sunset",
    input_image=image_bytes,  # Optional
    input_image_mime_type="image/jpeg"  # Optional
)
```

## Security Best Practices

1. **Never commit API keys**: Always use environment variables
2. **Rotate keys regularly**: Generate new API keys periodically
3. **Limit key permissions**: Use the minimum required permissions
4. **Monitor usage**: Keep track of API usage and costs

## Troubleshooting

### Service Initialization Fails

```
Gemini服务初始化失败: GEMINI_API_KEY environment variable is required
```

**Solution**: Ensure `GEMINI_API_KEY` is set in your environment variables.

### API Calls Fail

```
Gemini API调用失败: 401 Unauthorized
```

**Solution**: Verify your API key is valid and has the necessary permissions.

### Model Not Found

```
Gemini API调用失败: Model not found
```

**Solution**: Check that `GEMINI_MODEL` is set to a valid model name.

## Migration Notes

This refactoring changed:

1. **Hardcoded API key** → Environment variable `GEMINI_API_KEY`
2. **Hardcoded model name** → Environment variable `GEMINI_MODEL` with fallback
3. **Direct import** → Lazy initialization via `get_gemini_service()`

### Breaking Changes

- Code importing `gemini_service` directly must now use `get_gemini_service()`
- Environment variable `GEMINI_API_KEY` is now required for the service to work

### Backward Compatibility

- The service API remains the same
- Default model (`gemini-2.5-flash`) is preserved
- Error handling is improved but maintains similar behavior
