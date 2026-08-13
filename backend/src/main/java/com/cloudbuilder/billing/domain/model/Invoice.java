package com.cloudbuilder.billing.domain.model;

import com.cloudbuilder.shared.kernel.AggregateRoot;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "invoices")
public class Invoice extends AggregateRoot {

    @Column(nullable = false)
    private String tenantId;

    @Column(nullable = false)
    private String subscriptionId;

    @Column(nullable = false)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(nullable = false)
    private BigDecimal tax;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(nullable = false)
    private String currency;

    @Column
    private Instant dueDate;

    @Column
    private Instant paidAt;

    @Column
    private String stripeInvoiceId;

    @Column(columnDefinition = "TEXT")
    private String lineItemsJson;

    protected Invoice() {}

    public Invoice(String tenantId, String subscriptionId, String invoiceNumber,
                   BigDecimal subtotal, BigDecimal tax, BigDecimal total, String currency,
                   Instant dueDate) {
        this.tenantId = tenantId;
        this.subscriptionId = subscriptionId;
        this.invoiceNumber = invoiceNumber;
        this.status = InvoiceStatus.OPEN;
        this.subtotal = subtotal;
        this.tax = tax;
        this.total = total;
        this.currency = currency;
        this.dueDate = dueDate;
    }

    public void markPaid() { this.status = InvoiceStatus.PAID; this.paidAt = Instant.now(); }
    public void markVoid() { this.status = InvoiceStatus.VOID; }

    public String getTenantId() { return tenantId; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public InvoiceStatus getStatus() { return status; }
    public BigDecimal getTotal() { return total; }
    public String getCurrency() { return currency; }
    public Instant getDueDate() { return dueDate; }

    public enum InvoiceStatus {
        OPEN, PAID, VOID, PAST_DUE
    }
}
