package com.sazhnov.performance.openVTS;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;


@Getter
@Setter
@Configuration
public class OpenVTSConfiguration {
    @Value("${openvts.sso.enabled}")
    private String table;
}
