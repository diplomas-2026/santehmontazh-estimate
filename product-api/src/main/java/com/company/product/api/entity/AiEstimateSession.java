package com.company.product.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "ai_estimate_sessions")
public class AiEstimateSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private UserAccount createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AiEstimateSessionStatus status;

    @Column(nullable = false, length = 10000)
    private String initialRequest;

    @Column(nullable = false, length = 10000)
    private String assistantMessage;

    @Column(nullable = false, length = 255)
    private String estimateName;

    @Column(nullable = false, length = 10000)
    private String estimateNotes;

    @Column(nullable = false, length = 20000)
    private String questionsJson;

    @Column(nullable = false, length = 20000)
    private String answersJson;

    @Column(nullable = false, length = 40000)
    private String draftItemsJson;

    @Column(nullable = false)
    private long totalTokensUsed;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
}
