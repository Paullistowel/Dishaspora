package com.dishaspora.feedback.service;

import com.dishaspora.feedback.dto.FeedbackDtos.CreateFeedbackRequest;
import com.dishaspora.feedback.dto.FeedbackDtos.FeedbackDto;
import com.dishaspora.feedback.entity.Feedback;
import com.dishaspora.feedback.repository.FeedbackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FeedbackService {

    private final FeedbackRepository repository;

    public FeedbackService(FeedbackRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public FeedbackDto submit(Long userId, CreateFeedbackRequest request) {
        Feedback f = new Feedback();
        f.setUserId(userId);
        f.setType(request.type());
        f.setMessage(request.message());
        f.setRating(request.rating());
        f.setScreenshotUrl(request.screenshotUrl());
        f.setDeviceInfo(request.deviceInfo());
        f.setAppVersion(request.appVersion());
        return FeedbackDto.from(repository.save(f));
    }

    public List<FeedbackDto> listMine(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(FeedbackDto::from)
                .toList();
    }
}
