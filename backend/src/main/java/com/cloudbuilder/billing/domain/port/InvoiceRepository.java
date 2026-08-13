package com.cloudbuilder.billing.domain.port;

import com.cloudbuilder.billing.domain.model.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {

    Page<Invoice> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}
