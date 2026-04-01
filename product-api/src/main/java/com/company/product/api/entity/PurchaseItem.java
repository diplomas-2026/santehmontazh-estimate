package com.company.product.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "purchase_items")
public class PurchaseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_id", nullable = false)
    private Purchase purchase;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal plannedQuantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal plannedPrice;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal plannedLineTotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal actualQuantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal actualPrice;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal actualLineTotal;

    @Column(nullable = false, length = 1000)
    private String comment;
}
