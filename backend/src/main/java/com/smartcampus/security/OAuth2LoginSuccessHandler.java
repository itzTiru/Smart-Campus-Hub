package com.smartcampus.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider tokenProvider;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Value("${app.oauth2.pending-redirect-uri}")
    private String pendingRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        Object authPrincipal = authentication.getPrincipal();

        if (!(authPrincipal instanceof UserPrincipal principal)) {
            getRedirectStrategy().sendRedirect(request, response, "/login?error");
            return;
        }

        if (!Boolean.TRUE.equals(principal.getUser().getIsApproved())) {
            String pendingUrl = UriComponentsBuilder.fromUriString(pendingRedirectUri)
                    .queryParam("email", principal.getUser().getEmail())
                    .build()
                    .toUriString();

            getRedirectStrategy().sendRedirect(request, response, pendingUrl);
            return;
        }

        String token = tokenProvider.generateToken(principal);

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}