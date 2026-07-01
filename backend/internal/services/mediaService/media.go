package mediaService

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"

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
	logger    *slog.Logger
}

func NewMediaService(cfg *config.Config, mediaRepo domain.VenueMediaRepository, logger *slog.Logger) *MediaService {
	cld, _ := cloudinary.NewFromParams(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
	return &MediaService{
		cfg:       cfg,
		cld:       cld,
		mediaRepo: mediaRepo,
		logger:    logger,
	}
}

func (s *MediaService) Upload(ctx context.Context, venueID uuid.UUID, file io.Reader, filename string, primary bool, sortOrder int32) (*domain.VenueMedia, error) {
	s.logger.InfoContext(ctx, "uploading image to cloudinary",
		"venue_id", venueID,
		"filename", filename,
		"primary", primary,
		"sort_order", sortOrder,
	)

	uploadResult, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:   fmt.Sprintf("venues/%s", venueID),
		PublicID: filename,
	})
	if err != nil {
		s.logger.ErrorContext(ctx, "cloudinary upload failed",
			"venue_id", venueID,
			"filename", filename,
			"err", err,
		)
		return nil, fmt.Errorf("upload: %w", domain.ErrMediaUploadFailed)
	}

	s.logger.InfoContext(ctx, "image uploaded to cloudinary",
		"venue_id", venueID,
		"public_id", uploadResult.PublicID,
		"format", uploadResult.Format,
		"bytes", uploadResult.Bytes,
		"width", uploadResult.Width,
		"height", uploadResult.Height,
	)

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

	created, err := s.mediaRepo.Create(ctx, record)
	if err != nil {
		s.logger.ErrorContext(ctx, "failed to persist venue media record",
			"venue_id", venueID,
			"public_id", uploadResult.PublicID,
			"err", err,
		)
		return nil, fmt.Errorf("persist media: %w", err)
	}

	s.logger.InfoContext(ctx, "venue media record created",
		"media_id", created.MediaID,
		"venue_id", venueID,
	)
	return created, nil
}

func (s *MediaService) UploadFromURL(ctx context.Context, venueID uuid.UUID, imageURL string, primary bool, sortOrder int32) (*domain.VenueMedia, error) {
	s.logger.InfoContext(ctx, "uploading image from url to cloudinary",
		"venue_id", venueID,
		"source_url", imageURL,
		"primary", primary,
		"sort_order", sortOrder,
	)

	uploadResult, err := s.cld.Upload.Upload(ctx, imageURL, uploader.UploadParams{
		Folder: fmt.Sprintf("venues/%s", venueID),
	})
	if err != nil {
		s.logger.ErrorContext(ctx, "cloudinary upload from url failed",
			"venue_id", venueID,
			"source_url", imageURL,
			"err", err,
		)
		return nil, fmt.Errorf("upload from url: %w", domain.ErrMediaUploadFailed)
	}

	s.logger.InfoContext(ctx, "image uploaded from url to cloudinary",
		"venue_id", venueID,
		"public_id", uploadResult.PublicID,
		"format", uploadResult.Format,
		"bytes", uploadResult.Bytes,
	)

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

	created, err := s.mediaRepo.Create(ctx, record)
	if err != nil {
		s.logger.ErrorContext(ctx, "failed to persist venue media record",
			"venue_id", venueID,
			"public_id", uploadResult.PublicID,
			"err", err,
		)
		return nil, fmt.Errorf("persist media: %w", err)
	}

	s.logger.InfoContext(ctx, "venue media record created",
		"media_id", created.MediaID,
		"venue_id", venueID,
	)
	return created, nil
}

func (s *MediaService) Delete(ctx context.Context, mediaID uuid.UUID) error {
	s.logger.InfoContext(ctx, "deleting venue media",
		"media_id", mediaID,
	)

	media, err := s.mediaRepo.GetByID(ctx, mediaID)
	if err != nil {
		s.logger.ErrorContext(ctx, "failed to fetch venue media for deletion",
			"media_id", mediaID,
			"err", err,
		)
		return fmt.Errorf("get media: %w", err)
	}

	var meta struct {
		CloudinaryPublicID string `json:"cloudinary_public_id"`
	}
	if err := json.Unmarshal(media.Metadata, &meta); err == nil && meta.CloudinaryPublicID != "" {
		s.logger.InfoContext(ctx, "destroying cloudinary asset",
			"media_id", mediaID,
			"public_id", meta.CloudinaryPublicID,
		)

		_, err := s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
			PublicID: meta.CloudinaryPublicID,
		})
		if err != nil {
			s.logger.ErrorContext(ctx, "cloudinary destroy failed",
				"media_id", mediaID,
				"public_id", meta.CloudinaryPublicID,
				"err", err,
			)
			return fmt.Errorf("destroy cloudinary: %w", domain.ErrMediaDeleteFailed)
		}

		s.logger.InfoContext(ctx, "cloudinary asset destroyed",
			"media_id", mediaID,
			"public_id", meta.CloudinaryPublicID,
		)
	}

	if err := s.mediaRepo.Delete(ctx, mediaID); err != nil {
		s.logger.ErrorContext(ctx, "failed to delete venue media record",
			"media_id", mediaID,
			"err", err,
		)
		return fmt.Errorf("delete record: %w", err)
	}

	s.logger.InfoContext(ctx, "venue media deleted",
		"media_id", mediaID,
	)
	return nil
}

func (s *MediaService) ListByVenue(ctx context.Context, venueID uuid.UUID) ([]*domain.VenueMedia, error) {
	return s.mediaRepo.ListByVenue(ctx, venueID)
}

func (s *MediaService) SetPrimary(ctx context.Context, mediaID uuid.UUID) (*domain.VenueMedia, error) {
	s.logger.InfoContext(ctx, "setting venue media as primary",
		"media_id", mediaID,
	)

	result, err := s.mediaRepo.SetPrimary(ctx, mediaID)
	if err != nil {
		s.logger.ErrorContext(ctx, "failed to set primary venue media",
			"media_id", mediaID,
			"err", err,
		)
		return nil, fmt.Errorf("set primary: %w", err)
	}

	s.logger.InfoContext(ctx, "venue media set as primary",
		"media_id", mediaID,
		"venue_id", result.VenueID,
	)
	return result, nil
}
