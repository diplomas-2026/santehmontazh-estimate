package com.company.product.api.controller;

import com.company.product.api.dto.ErrorResponse;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ErrorResponse> handleNotFound(NotFoundException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorResponse> handleForbidden(AccessDeniedException exception, HttpServletRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN, "Недостаточно прав для выполнения операции", request);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    ResponseEntity<ErrorResponse> handleValidation(Exception exception, HttpServletRequest request) {
        String message;
        if (exception instanceof MethodArgumentNotValidException methodArgumentNotValidException) {
            message = methodArgumentNotValidException.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        } else {
            BindException bindException = (BindException) exception;
            message = bindException.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        }
        return buildResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorResponse> handleGeneric(Exception exception, HttpServletRequest request) {
        log.error("Unhandled exception for {} {}", request.getMethod(), request.getRequestURI(), exception);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "На сервере произошла ошибка. Попробуйте еще раз чуть позже.", request);
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ErrorResponse(
            OffsetDateTime.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            request.getRequestURI()
        ));
    }
}
