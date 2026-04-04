# Stock Media Downloads

## Quick Search Links

| Site | URL |
|------|-----|
| **Pixabay Videos** | https://pixabay.com/videos/search/sewing/ |
| **Pixabay Images** | https://pixabay.com/images/search/sewing/ |
| **Mixkit** | https://mixkit.co/free-stock-video/sewing/ |
| **Pexels Videos** | https://www.pexels.com/video/sewing/ |
| **Pexels Images** | https://www.pexels.com/search/sewing/ |
| **Videezy** | https://videezy.com/free-video/sewing |

## Per-Shop Keywords

- **S.A.S. Military Surplus**: military surplus, tactical gear, army uniforms
- **Lone Wolf Tactical**: tactical gear, military surplus, adventure equipment
- **North Carolina Military Supplies**: military supplies, SF veteran, army gear
- **Jin Sewing**: military uniforms, alterations, sewing machine
- **Kim's #1 Sewing**: fort bragg, uniform setup, berets
- **Kim's Speedy Sewing**: fast alterations, wedding dresses
- **Lee's Alterations**: wedding dresses, same day service
- **Monarch Cleaners**: dry cleaning, wedding dresses, leather care
- **One Stop Sewing**: fort bragg, boot shining, uniform setup
- **Otrebla's Tailoring**: custom suits, tuxedo, haberdashery
- **STAR Sewing**: military uniforms, patches, dog tags

## Folder Structure

```
shops/{shop-slug}/
├── images/
│   ├── hero.png      ← Generated placeholder
│   ├── logo.png      ← Generated placeholder
│   └── social.png    ← Generated placeholder
├── videos/
│   └── (download stock videos here)
└── prompts.json
```

## How to Use

1. **For Images**: 
   - Open https://midjourney.com/imagine
   - Copy prompts from `../all_prompts.json`
   - Save to `shops/{slug}/images/`

2. **For Videos**:
   - Search Pixabay/Mixkit using keywords above
   - Download free stock videos
   - Save to `shops/{slug}/videos/`

3. **For Stock Images**:
   - Search Pexels/Unsplash using keywords
   - Download free images
   - Save to `shops/{slug}/images/`
