package com.company.product.api.repository;

import com.company.product.api.entity.ApprovalComment;
import com.company.product.api.entity.CommentEntityType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalCommentRepository extends JpaRepository<ApprovalComment, Long> {

    List<ApprovalComment> findByEntityTypeAndEntityIdOrderByCreatedAtAsc(CommentEntityType entityType, Long entityId);
}
