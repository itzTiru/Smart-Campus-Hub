package com.smartcampus.security;

import com.smartcampus.entity.Role;
import com.smartcampus.entity.User;
import com.smartcampus.entity.enums.RoleName;
import com.smartcampus.repository.RoleRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub");
        String avatar = oAuth2User.getAttribute("picture");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not received from OAuth2 provider");
        }
        if (providerId == null || providerId.isBlank()) {
            throw new OAuth2AuthenticationException("Provider ID not received from OAuth2 provider");
        }

        User user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    existingUser.setName(name);
                    existingUser.setAvatarUrl(avatar);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    Role defaultRole = roleRepository.findByName(RoleName.USER)
                            .orElseThrow(() -> new RuntimeException("Default role USER not found"));
                    User newUser = User.builder()
        .email(email)
        .name(name)
        .oauthProviderId(providerId)
        .avatarUrl(avatar)
        .oauthProvider("google")
        .role(defaultRole)
        .isActive(true)
        .isApproved(false)
        .build();
                    return userRepository.save(newUser);
                });

        return new UserPrincipal(user, oAuth2User.getAttributes());
    }
}
