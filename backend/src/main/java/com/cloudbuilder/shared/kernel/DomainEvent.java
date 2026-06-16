package com.cloudbuilder.shared.kernel;

public abstract class DomainEvent<T> {
    private final String type;
    private final T payload;

    protected DomainEvent(String type, T payload) {
        this.type = type;
        this.payload = payload;
    }

    public String getType() { return type; }
    public T getPayload() { return payload; }
}
