package com.sazhnov_performance.openVTS;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the OpenVTS application.
 */
@SpringBootApplication
public final class OpenVtsApplication {

    // Private constructor to prevent instantiation
    private OpenVtsApplication() {
        throw new UnsupportedOperationException(
            "This is a utility class and cannot be instantiated"
        );
    }

    /**
     * Main entry point of the application.
     *
     * @param args Command-line arguments
     */
    public static void main(final String[] args) {
        SpringApplication.run(OpenVtsApplication.class, args);
    }
}
