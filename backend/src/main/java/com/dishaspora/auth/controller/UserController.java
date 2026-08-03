package com.dishaspora.auth.controller;

import com.dishaspora.auth.dto.AuthDtos.ChangeEmailRequest;
import com.dishaspora.auth.dto.AuthDtos.ChangePasswordRequest;
import com.dishaspora.auth.dto.AuthDtos.DeleteAccountRequest;
import com.dishaspora.auth.dto.AuthDtos.MessageResponse;
import com.dishaspora.auth.dto.AuthDtos.UpdateMeRequest;
import com.dishaspora.auth.dto.AuthDtos.UpdatePreferencesRequest;
import com.dishaspora.auth.dto.UserDto;
import com.dishaspora.auth.entity.User;
import com.dishaspora.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;

    public UserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal User user) {
        return UserDto.from(user);
    }

    @PutMapping("/me")
    public UserDto updateMe(@AuthenticationPrincipal User user, @Valid @RequestBody UpdateMeRequest request) {
        return authService.updateMe(user, request);
    }

    @PutMapping("/me/preferences")
    public UserDto updatePreferences(@AuthenticationPrincipal User user,
                                     @Valid @RequestBody UpdatePreferencesRequest request) {
        return authService.updatePreferences(user, request);
    }

    @PostMapping("/me/change-email")
    public MessageResponse changeEmail(@AuthenticationPrincipal User user,
                                       @Valid @RequestBody ChangeEmailRequest request) {
        authService.requestEmailChange(user, request);
        return new MessageResponse(
                "We've sent a confirmation link to " + request.newEmail()
                        + ". Your email changes once you confirm it.");
    }

    @PostMapping("/me/change-password")
    public MessageResponse changePassword(@AuthenticationPrincipal User user,
                                          @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user, request.currentPassword(), request.newPassword());
        return new MessageResponse("Your password has been updated.");
    }

    @DeleteMapping("/me")
    public MessageResponse deleteMe(@AuthenticationPrincipal User user,
                                    @Valid @RequestBody DeleteAccountRequest request) {
        authService.deleteAccount(user, request.password());
        return new MessageResponse("Your account has been deleted.");
    }
}
