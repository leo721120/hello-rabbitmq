FROM rabbitmq:3-management-alpine
RUN rabbitmq-plugins enable rabbitmq_mqtt
EXPOSE 1883 1883