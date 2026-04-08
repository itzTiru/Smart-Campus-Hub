package com.smartcampus.security;

import com.smartcampus.entity.Technician;
import com.smartcampus.entity.User;
import com.smartcampus.repository.TechnicianRepository;
import com.smartcampus.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            String subject = tokenProvider.getUserIdFromToken(token);

            if (subject.startsWith("TECH:")) {
                authenticateTechnician(subject.substring(5), request);
            } else {
                authenticateUser(subject, request);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private void authenticateUser(String userId, HttpServletRequest request) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !Boolean.TRUE.equals(user.getIsActive())) {
            return;
        }

        UserPrincipal principal = new UserPrincipal(user, Map.of());
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void authenticateTechnician(String technicianId, HttpServletRequest request) {
        Technician technician = technicianRepository.findById(technicianId).orElse(null);
        if (technician == null || !Boolean.TRUE.equals(technician.getIsActive())) {
            return;
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        technician,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN"))
                );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
