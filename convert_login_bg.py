import os
from PIL import Image
import colorsys

def convert_orange_to_blue_gradient(src_path, dst_path):
    img = Image.open(src_path).convert('RGB')
    width, height = img.size
    
    pixels = img.load()
    
    # Process each pixel
    for y in range(height):
        # Calculate vertical position ratio for gradient nuance
        y_ratio = y / height
        for x in range(width):
            x_ratio = x / width
            r, g, b = pixels[x, y]
            
            # Convert RGB to HSV (all 0.0 to 1.0)
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            
            # In HSV:
            # Red/Orange/Warm hues are around 0.95 -> 1.0 (340°-360°) and 0.0 -> 0.15 (0°-55°)
            # Blue is around 0.58 -> 0.65 (210° to 235°)
            # Cyan is around 0.50 -> 0.55 (180° to 200°)
            
            # Check if warm/red/orange
            is_warm = (h >= 0.92 or h <= 0.18) and s > 0.15
            
            if is_warm:
                # Map warm hue to a dynamic blue gradient:
                # Horizontal shift: from cyan/sapphire on left to deep electric sapphire & indigo on right
                target_h = 0.57 + (x_ratio * 0.07) + ((1 - y_ratio) * 0.02) # ~205° to ~235°
                
                # Enhance saturation and brightness for luminous luxury look
                target_s = min(1.0, s * 1.15)
                target_v = v
                
                # Convert back to RGB
                new_r, new_g, new_b = colorsys.hsv_to_rgb(target_h, target_s, target_v)
                pixels[x, y] = (int(new_r * 255), int(new_g * 255), int(new_b * 255))
            else:
                # Cool/dark background tones: push slightly toward deep slate indigo for cohesive atmosphere
                target_h = 0.58 + (x_ratio * 0.05)
                target_s = s * 0.9
                target_v = v * 0.95
                new_r, new_g, new_b = colorsys.hsv_to_rgb(target_h, target_s, target_v)
                pixels[x, y] = (int(new_r * 255), int(new_g * 255), int(new_b * 255))
                
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    img.save(dst_path, quality=95)
    print(f"Successfully converted and saved to {dst_path}")

if __name__ == '__main__':
    src = '/Users/user/.gemini/antigravity-ide/brain/a7faaa33-5030-4df9-8b59-3197259715ca/.user_uploaded/media_1788075170272.jpg'
    dst1 = '/Users/user/DNA360 APP/public/images/login-bg-fluted-blue.jpg'
    dst2 = '/Users/user/.gemini/antigravity-ide/brain/a7faaa33-5030-4df9-8b59-3197259715ca/login-bg-fluted-blue.jpg'
    convert_orange_to_blue_gradient(src, dst1)
    convert_orange_to_blue_gradient(src, dst2)
