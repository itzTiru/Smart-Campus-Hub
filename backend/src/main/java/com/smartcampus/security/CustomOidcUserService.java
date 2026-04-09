package com.smartcampus.security;

import com.smartcampus.entity.Role;
import com.smartcampus.entity.User;
import com.smartcampus.entity.enums.RoleName;
import com.smartcampus.repository.RoleRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName();
        String providerId = oidcUser.getSubject();
        String avatar = oidcUser.getPicture();

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not received from Google");
        }
        if (providerId == null || providerId.isBlank()) {
            throw new OAuth2AuthenticationException("Provider ID not received from Google");
        }

        Role defaultRole = roleRepository.findByName(RoleName.USER)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleName.USER).build()
                ));

        User user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    existingUser.setName(name);
                    existingUser.setAvatarUrl(avatar);
                    existingUser.setOauthProvider("google");
                    existingUser.setOauthProviderId(providerId);
                    existingUser.setIsActive(true);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
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

        return new UserPrincipal(user, oidcUser.getClaims());
    }
}
