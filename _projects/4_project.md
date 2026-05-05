---
layout: page
title: Fixed wing flight controller
description: "A simple flight controller utilizing STM32F103C8T6 microncontroller with some peripherals to control flight tasks such as: auto take off, normal, balancing flight mode..."
code: https://github.com/atomvn/FlightController
img: assets/img/projects/FlightController/Su27.jpg
importance: 3
category: fun
---

## Reasons for the project's creation
This project showcases my personal interest for designing and making planes and jets.

## System architecture
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/FlightController/HardwareMapping.jpg" title="Flight controller hardware mapping" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Flight controller's hardware mapping
</div>

<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/FlightController/ControlFlow.jpg" title="Flight controller control flow" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    Flight controller's control flow
</div>

## Prodect demo
<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/FlightController/FlightControllerSide1.jpg" title="Flight controller backside" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">

</div>


<div class="row">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/FlightController/FlightControllerSide1.jpg" title="flight controller side 1" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/FlightController/FlightControllerSide2.jpg" title="flight controller side 2" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/FlightController/FlightControllerSide3.jpg" title="flight controller side 3" class="img-fluid rounded z-depth-1" %}
    </div>
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/projects/FlightController/FlightControllerSide4.jpg" title="flight controller side 4" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
<div class="caption">
    My flight controller components including: STM32F103C8T6 MCU, MPU6050 sensor, MCRE7_v2 receiver soldered on a perfboard. 
</div>
