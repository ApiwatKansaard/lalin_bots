## ADDED Requirements

### Requirement: Resize unregistered Rich Menu image to LINE dimensions
The system SHALL resize `Gemini_Generated_Image_hluv60hluv60hluv.png` (3552×1184) to exactly 2500×843 pixels and save as `assets/richmenu-unregistered.png`.

#### Scenario: Unregistered image meets LINE requirements
- **WHEN** the processed image is uploaded to LINE as a Rich Menu image
- **THEN** LINE accepts it without error because it is exactly 2500×843 pixels and under 1MB

### Requirement: Resize registered Rich Menu image to LINE dimensions
The system SHALL resize `Gemini_Generated_Image_3p57i33p57i33p57.png` (2528×1696) to exactly 2500×1686 pixels and save as `assets/richmenu-registered.png`.

#### Scenario: Registered image meets LINE requirements
- **WHEN** the processed image is uploaded to LINE as a Rich Menu image
- **THEN** LINE accepts it without error because it is exactly 2500×1686 pixels and under 1MB

### Requirement: Compress images under 1MB
Each processed image SHALL be under 1MB in file size. If PNG exceeds 1MB after resize, the image SHALL be converted to JPEG at quality 85%.

#### Scenario: Large PNG compressed to under 1MB
- **WHEN** a resized PNG image exceeds 1MB
- **THEN** the system converts it to JPEG at 85% quality, resulting in a file under 1MB

#### Scenario: Small PNG kept as PNG
- **WHEN** a resized PNG image is already under 1MB
- **THEN** the image is kept as PNG format

### Requirement: Clean up original Gemini files
After successful resize and verification, the original `Gemini_Generated_Image_*.png` files SHALL be removed from the assets directory to avoid confusion.

#### Scenario: Only processed files remain
- **WHEN** image processing is complete
- **THEN** the assets directory contains `richmenu-unregistered.png` (or .jpg) and `richmenu-registered.png` (or .jpg) but NOT the original Gemini-generated files
