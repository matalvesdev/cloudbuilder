package com.cloudbuilder.audit.domain.service;

import com.cloudbuilder.audit.domain.model.AuditEvent;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Factory for JPA Specifications used by AuditQueryService.
 * Pushes filtering to the database instead of in-memory.
 */
public final class AuditEventSpecifications {

    private AuditEventSpecifications() {
        // utility class
    }

    public static Specification<AuditEvent> withFilters(
            String tenantId,
            String userId,
            String action,
            String resourceType,
            Instant start,
            Instant end) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Tenant is always required
            predicates.add(cb.equal(root.get("tenantId"), tenantId));

            // Timestamp range
            predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), start));
            predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), end));

            // Optional filters
            if (userId != null && !userId.isBlank()) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (resourceType != null && !resourceType.isBlank()) {
                predicates.add(cb.equal(root.get("resourceType"), resourceType));
            }

            query.orderBy(cb.desc(root.get("timestamp")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
