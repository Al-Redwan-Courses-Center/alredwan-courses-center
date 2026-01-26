# Cloudinary Integration Setup for Redwan Courses Center

## 📋 Overview

This project uses **Cloudinary** for cloud-based image storage with automatic compression, optimization, and organized folder structure.

## 🎯 Features

- ✅ **Automatic image compression** before upload
- ✅ **File size validation** (configurable max size)
- ✅ **Image format validation** (JPEG, PNG, WEBP, GIF)
- ✅ **Organized folder structure** on Cloudinary
- ✅ **Automatic format conversion** to optimized JPEG
- ✅ **Responsive image delivery** with Cloudinary CDN
- ✅ **Client-side file size limits** enforced

## 📁 Folder Organization on Cloudinary

All images are organized under the `redwan/` root folder:

```
redwan/
├── students/{user_id}/
│   └── profile images
├── instructors/{user_id}/
│   ├── profile/
│   │   └── profile images
│   └── nid/
│       └── national ID images (front & back)
├── parents/{user_id}/
│   └── profile images
└── children/{child_id}/
    └── profile images
```

## 🚀 Setup Instructions

### 1. Get Cloudinary Credentials

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Go to your Dashboard
3. Copy your:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 2. Configure Environment Variables

Add these variables to your `.env` or `backend.env` file:

```bash
# Required Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# Optional Image Settings (defaults shown)
MAX_IMAGE_SIZE_MB=5
IMAGE_COMPRESSION_QUALITY=80
IMAGE_MAX_WIDTH=1920
IMAGE_MAX_HEIGHT=1920
TARGET_IMAGE_SIZE_KB=500  # Target file size in kilobytes (default: 500KB)
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

The required packages are:
- `cloudinary==1.41.0`
- `django-cloudinary-storage==0.3.0`

### 4. Run Migrations (if needed)

```bash
python manage.py makemigrations
python manage.py migrate
```

## 💡 How It Works

### Automatic Image Processing

When an image is uploaded, the system automatically:

1. **Validates** the file format and size
2. **Compresses** the image to JPEG format
3. **Resizes** if larger than max dimensions (maintains aspect ratio)
4. **Optimizes** quality to 80% (configurable)
5. **Applies aggressive compression** to meet the target size of 500KB (configurable)
6. **Uploads** to Cloudinary with organized path
7. **Returns** CDN URL for fast delivery

### File Size Limits

- **Default maximum**: 5MB per image
- **Configurable** via `MAX_IMAGE_SIZE_MB` environment variable
- **Enforced on upload** with clear error messages

### Compression Settings

- **Quality**: 80% (configurable via `IMAGE_COMPRESSION_QUALITY`)
- **Max Width**: 1920px (configurable via `IMAGE_MAX_WIDTH`)
- **Max Height**: 1920px (configurable via `IMAGE_MAX_HEIGHT`)
- **Target Size**: 500KB (configurable via `TARGET_IMAGE_SIZE_KB`)
- **Format**: Converts to JPEG for optimal compression

## 🔧 Usage in Models

All models with images use the `CloudinaryImageMixin`:

```python
from core.utils.image_utils import CloudinaryImageMixin, validate_image_size

class StudentUser(CloudinaryImageMixin, models.Model):
    image = models.ImageField(
        upload_to=student_upload_path,
        validators=[validate_image_size],
        null=True
    )
```

The mixin automatically compresses and optimizes images on save.

## 📤 API Integration

### Using in Serializers

```python
from core.utils.image_serializers import ImageUploadSerializer

class StudentSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(validators=[validate_image_size])
    
    class Meta:
        model = StudentUser
        fields = ['id', 'image', ...]
```

### Client-Side Example

```javascript
// Upload student image
const formData = new FormData();
formData.append('image', imageFile);

// The API will validate file size and compress automatically
fetch('/api/students/{id}/upload-image/', {
    method: 'POST',
    body: formData,
    headers: {
        'Authorization': 'JWT your-token-here'
    }
});
```

## 🎨 Cloudinary Transformations

You can add transformations to image URLs for different use cases:

### Get Thumbnail (200x200)
```
https://res.cloudinary.com/{cloud_name}/image/upload/c_thumb,w_200,h_200/{public_id}
```

### Get Optimized with Auto Format
```
https://res.cloudinary.com/{cloud_name}/image/upload/f_auto,q_auto/{public_id}
```

### Get Responsive Image
```
https://res.cloudinary.com/{cloud_name}/image/upload/w_auto,dpr_auto/{public_id}
```

## 🔒 Security Features

- ✅ File size validation on server
- ✅ File format validation (only images allowed)
- ✅ Secure API credentials via environment variables
- ✅ HTTPS-only delivery
- ✅ Organized access control via folder structure

## 📊 Image Upload Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `MAX_IMAGE_SIZE_MB` | 5 | Maximum file size in megabytes |
| `IMAGE_COMPRESSION_QUALITY` | 80 | JPEG quality (1-100) |
| `IMAGE_MAX_WIDTH` | 1920 | Maximum width in pixels |
| `IMAGE_MAX_HEIGHT` | 1920 | Maximum height in pixels |
| `TARGET_IMAGE_SIZE_KB` | 500 | Target file size in kilobytes |

## 🐛 Troubleshooting

### Images not uploading?

1. Check environment variables are set correctly
2. Verify Cloudinary credentials
3. Check file size is under limit
4. Ensure image format is valid (JPEG, PNG, WEBP, GIF)

### Cloudinary quota exceeded?

- Free tier: 25 GB storage, 25 GB bandwidth/month
- Consider upgrading or implementing image cleanup

### Images look blurry?

- Increase `IMAGE_COMPRESSION_QUALITY` (default: 80)
- Increase `IMAGE_MAX_WIDTH` and `IMAGE_MAX_HEIGHT`
- Adjust `TARGET_IMAGE_SIZE_KB` for less aggressive compression

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Django Cloudinary Storage](https://github.com/klis87/django-cloudinary-storage)
- [Image Optimization Best Practices](https://cloudinary.com/blog/image_optimization)

## 🎉 Benefits

- ✅ **No local storage** - all images on cloud
- ✅ **CDN delivery** - fast loading worldwide
- ✅ **Automatic optimization** - smaller file sizes
- ✅ **Organized structure** - easy management
- ✅ **Scalable** - handles growth automatically
- ✅ **Backup** - images stored safely on Cloudinary
