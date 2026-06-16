package com.cloudbuilder.shared.kernel;

import java.util.ArrayList;
import java.util.List;

public abstract class AggregateRoot extends BaseEntity {

    private final transient List<DomainEvent<?>> domainEvents = new ArrayList<>();

    protected void registerDomainEvent(DomainEvent<?> event) {
        domainEvents.add(event);
    }

    public List<DomainEvent<?>> getDomainEvents() {
        return List.copyOf(domainEvents);
    }

    public void clearEvents() {
        domainEvents.clear();
    }
}
