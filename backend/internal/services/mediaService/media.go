package mediaService

import (
	"context"
	"encoding/json"
	"fmt"
	"io"

	"github.com/Nit-Simple/BookMyVenue/internal/config"
	"github.com/Nit-Simple/BookMyVenue/internal/domain"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/google/uuid"
)

type MediaService struct {
	cfg       *config.Config
	cld       *cloudinary.Cloudinary
	mediaRepo domain.VenueMediaRepository
}

func NewMediaService(cfg *config.Config, mediaRepo domain.VenueMediaRepository) *MediaService {
	cld, _ := cloudinary.NewFromParams(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
	return &MediaService{
		cfg:       cfg,
		cld:       cld,
		mediaRepo: mediaRepo,
	}
}

func (s *MediaService) Upload(ctx context.Context, venueID uuid.UUID, file io.Reader, filename string, primary bool, sortOrder int32) (*domain.VenueMedia, error) {
	uploadResult, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:   fmt.Sprintf("venues/%s", venueID),
		PublicID: filename,
	})
	if err != nil {
		return nil, fmt.Errorf("media: cloudinary upload failed: %w", err)
	}

	meta := map[string]any{
		"cloudinary_public_id": uploadResult.PublicID,
		"format":               uploadResult.Format,
		"width":                uploadResult.Width,
		"height":               uploadResult.Height,
		"bytes":                uploadResult.Bytes,
	}
	metaRaw, _ := json.Marshal(meta)

	record := &domain.VenueMedia{
		VenueID:   venueID,
		URL:       uploadResult.SecureURL,
		Primary:   primary,
		Metadata:  metaRaw,
		SortOrder: sortOrder,
	}

	return s.mediaRepo.Create(ctx, record)
}

func (s *MediaService) UploadFromURL(ctx context.Context, venueID uuid.UUID, imageURL string, primary bool, sortOrder int32) (*domain.VenueMedia, error) {
	uploadResult, err := s.cld.Upload.Upload(ctx, imageURL, uploader.UploadParams{
		Folder: fmt.Sprintf("venues/%s", venueID),
	})
	if err != nil {
		return nil, fmt.Errorf("media: cloudinary upload from url failed: %w", err)
	}

	meta := map[string]any{
		"cloudinary_public_id": uploadResult.PublicID,
		"format":               uploadResult.Format,
		"width":                uploadResult.Width,
		"height":               uploadResult.Height,
		"bytes":                uploadResult.Bytes,
	}
	metaRaw, _ := json.Marshal(meta)

	record := &domain.VenueMedia{
		VenueID:   venueID,
		URL:       uploadResult.SecureURL,
		Primary:   primary,
		Metadata:  metaRaw,
		SortOrder: sortOrder,
	}

	return s.mediaRepo.Create(ctx, record)
}

func (s *MediaService) Delete(ctx context.Context, mediaID uuid.UUID) error {
	media, err := s.mediaRepo.GetByID(ctx, mediaID)
	if err != nil {
		return fmt.Errorf("media: get by id: %w", err)
	}

	var meta struct {
		CloudinaryPublicID string `json:"cloudinary_public_id"`
	}
	if err := json.Unmarshal(media.Metadata, &meta); err == nil && meta.CloudinaryPublicID != "" {
		_, err := s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: meta.CloudinaryPublicID,
		})
		if err != nil {
			return fmt.Errorf("media: cloudinary destroy failed: %w", err)
		}
	}

	return s.mediaRepo.Delete(ctx, mediaID)
}

func (s *MediaService) ListByVenue(ctx context.Context, venueID uuid.UUID) ([]*domain.VenueMedia, error) {
	return s.mediaRepo.ListByVenue(ctx, venueID)
}

func (s *MediaService) SetPrimary(ctx context.Context, mediaID uuid.UUID) (*domain.VenueMedia, error) {
	return s.mediaRepo.SetPrimary(ctx, mediaID)
}
