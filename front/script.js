$(document).ready(function() {
    const token = localStorage.getItem("token");
    const employeesArray = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentWeekNumber = getCurrentWeekNumber();
    const newScheduleWeekSelect = $('#newScheduleWeekSelect');
    
    let counter = currentWeekNumber;
    let morningSchedule = [];
    let eveningSchedule = [];
    let nightSchedule = [];
    let supervisorSchedule = [];
    let weekId;
    

    // Decoded the token
    function decodeJWT(token) {
        const [header, payload, signature] = token.split('.');
    
        const decodedHeader = JSON.parse(atob(header));
        const decodedPayload = JSON.parse(atob(payload));
    
        return {
            header: decodedHeader,
            payload: decodedPayload,
            signature: signature
        };
    }

    //Create, Display and update the list and the selects of the employees
    function getEmployees() {
        $('#allEmployees ul').html('');
        employeesArray.map((employee, index) => {
            $('#allEmployees ul').append(`
            <li>${index+1}. ${employee.name+' '+employee.last_name } 
            <button type="button" class="dataBTN" id="${employee.id}">!</button>
            <button type="button" class="deleteBTN" id="${employee.id}" data-id="${index}">Delete</button></li>
            <br>`);
        });

        $('.selectEmployee').html('<option>-</option>');

        employeesArray.map(employee => {
            $('.selectEmployee').append(`
                <option>${employee.name}</option>
            `);
        });
    }

    //Identifies the user and displays his details
    function getMyProfile() {
        $.ajax({
            url: 'http://localhost:8080/api/getEmployees',
            data:{
                token:token
            },
            success: function(data) {
                const filteredEployeesArray = data.result.filter(employee => employee.job_place === data.payload.jobPlace);
                employeesArray.length = 0;
                employeesArray.push(...filteredEployeesArray);

                const mail = data.payload.mail;
                const isAdmin = employeesArray.filter(employee => employee.mail === mail);

                if(isAdmin[0].is_admin === 0){
                    $('.navbar-admin').remove();
                }else{
                    $('#MySchedule').remove();
                }

                const myProfile = data.result.filter(employee => employee.mail === data.payload.mail);
                const passwordLength = (myProfile[0].password).length;
                const period = new Date(myProfile[0].date);
                const currentTime = new Date().getTime();
                const millisecondsPerDay = 24*60*60*1000;
                let periodTime = Math.floor((currentTime-period.getTime()) / millisecondsPerDay);
                const formatedDateArray = ((myProfile[0].date).split('T'))[0].split('-');
                const formatedDate = `${formatedDateArray[2]}/${formatedDateArray[1]}/${formatedDateArray[0]}`;

                if( periodTime < 30){
                    periodTime = `${periodTime} days`;
                }
                
                if(periodTime > 30 || periodTime < 365 ){
                    const months = Math.floor(periodTime/30);

                    periodTime = `${months} months`;
                }
                
                if(periodTime >= 365 ){
                   const years = Math.floor(periodTime/365);
                   const months = ((periodTime/365 - Math.floor(years))*365)/30;

                   periodTime = `${years} years ${Math.floor(months)} months`;
                }

                $('.profile').html(``);
                $('.profile').html(`
                    <div class="row" id="profileData">
                        <div class="col-12">
                            <h2>${myProfile[0].name} ${myProfile[0].last_name}'s profile</h2>
                        </div>
                        <div class="col-xs-6" id="profileDetails">
                            <p>ID<span id="colon">:</span><span> ${myProfile[0].id}</span></p>
                            <p>Mail<span id="colon">:</span><span> ${myProfile[0].mail}</span></p>
                            <p>Phone Number<span id="colon">:</span><span> ${myProfile[0].phone}</span></p>
                            <p>Password<span id="colon">:</span><span> ${'*****'}</span></p>
                        </div>
                        <div class="col-xs-6" id="profileDetails">
                            <p>Full name<span id="colon">:</span><span> ${myProfile[0].name} ${myProfile[0].last_name}</span></p>
                            <p>Job Place<span id="colon">:</span><span> ${myProfile[0].job_place}</span></p>
                            <p>Rank<span id="colon">:</span><span> ${myProfile[0].is_admin === 1 ? 'Manager' : 'Employee'}</span></p>
                            <p>Period<span id="colon">:</span><span> ${periodTime}<br>${formatedDate}</span></p>
                        </div>
                        <div class="col-xs-12" id="profileButttons">
                            <button type="button" class="buttons" id="profileEditBTN">Edit <i class="fa-solid fa-pen-to-square"></i></button>
                        </div>
                    </div>
                `);
                
                getEmployees();
            }
        });
    }

    //Get the current week number
    function getCurrentWeekNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const oneWeekMilliseconds = 604800000;
        
        const diffInMilliseconds = today - firstDayOfYear;
        
        const weekNumber = Math.ceil(diffInMilliseconds / oneWeekMilliseconds);

        return weekNumber;
    }
    
    //Displays the main table according to the current week
    function mainTable(week) {
        $.ajax({
            url: 'http://localhost:8080/api/mainTable',
            data: {
                id: week,
                token: token
            },
            success: function(res) {
                const employeeToken = decodeJWT(token).payload.mail;
                const employeeName = (employeesArray.filter(employee => employee.mail === employeeToken))[0].name;

                $('#helloName').html(`Hello <span>${employeeName}</span> good to see you.`)
                $('#mainTableWeek').html(`<h4>This week is the ${week} week of the year<h4>`)
    
                const currentYear = new Date().getFullYear();
                const oneDayMilliseconds = 86400000;
                const currentDate = (((getWeekDates(currentYear, week)).split('-'))[1]).split('/');
                const formatedCurrentDate = `${currentDate[1]}/${currentDate[0]}/${currentDate[2]}`
                let date = new Date(formatedCurrentDate).getTime();; // Get current date in milliseconds

                days.map(day => {
                    $(`#main${day}Title`).html(`${day}, ${new Date(date).toLocaleDateString()}`);
                    date += oneDayMilliseconds; // Increment date by one day
                });
                
                if(!res[3]){
                    $('#mainTableTbody').html(`
                        <tr class="mainMorningShift">
                            <td class="tableText">Morning</td>
                        </tr>
                        <tr class="mainEveningShift"> 
                            <td class="tableText">Evening</td>
                        </tr>
                        <tr class="mainSupervisorShift">
                            <td class="tableText">Shift supervisor</td>
                        </tr>
                    `);
                }else{
                    $('#mainTableTbody').html(`
                        <tr class="mainMorningShift">
                            <td class="tableText">Morning</td>
                        </tr>
                        <tr class="mainEveningShift"> 
                            <td class="tableText">Evening</td>
                        </tr>
                        <tr class="mainNightShift">
                            <td class="tableText">Night</td>
                        </tr>
                        <tr class="mainSupervisorShift">
                            <td class="tableText">Shift supervisor</td>
                        </tr>
                    `);
                }


                const morning = res[0];
                const evening = res[1];
                const supervisor = res[2];
                const night = res[3]
    
                const morningShiftContent = days.map((day, index) => {
                    const employees = (morning[day.toLowerCase()]).split(',');
                    return `<td>${employees.map(employee => `<p>${employee}</p>`).join('')}</td>`;
                })
    
                $('.mainMorningShift').html(`
                    <td class="mainTableText">Morning</td>
                    ${morningShiftContent}
                `);
    
                const eveningShiftContent = days.map((day, index) => {
                    const employees = (evening[day.toLowerCase()]).split(',');
                    return `<td>${employees.map(employee => `<p>${employee}</p>`).join('')}</td>`;
                });
    
                $('.mainEveningShift').html(`
                    <td>Evening</td>
                    ${eveningShiftContent}
                `);
                
                if(night){
                    const nightShiftContent = days.map((day, index) => {
                        const employees = (night[day.toLowerCase()]).split(',');
                        return `<td>${employees.map(employee => `<p>${employee}</p>`).join('')}</td>`;
                    });
        
                    $('.mainNightShift').html(`
                        <td>Night</td>
                        ${nightShiftContent}
                    `);
                }
    
                const supervisorShiftContent = days.map((day, index) => {
                    const employees = (supervisor[day.toLowerCase()]).split(',');
                    return `<td>${employees.map(employee => `<p>${employee}</p>`).join('')}</td>`;
                })
    
                $('.mainSupervisorShift').html(`
                    <td>Shift supervisor</td>
                    ${supervisorShiftContent}
                `);
            }
        });
    }

    //Get the date of each week 
    function getWeekDates(year, weekNumber) {
        const januaryFirst = new Date(year, 0, 1);
        const firstDay = new Date(januaryFirst.getTime() + ((weekNumber - 1) * 7 - januaryFirst.getDay()) * 86400000);
        const lastDay = new Date(firstDay.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        const startDate = firstDay.toLocaleDateString('en-GB');
        const endDate = lastDay.toLocaleDateString('en-GB');
        
        return `Week ${weekNumber} - ${startDate}-${endDate}`;
    }

    //Append the weeks number and the week number to the select at the new schedule 
    function getWeekSelects(selectWeek) {
        newScheduleWeekSelect.html('<option>Select week</option>');

        const currentYear = new Date().getFullYear();

        for (let i = 1; i <= 52; i++) {
            const weekDates = getWeekDates(currentYear, i);
            newScheduleWeekSelect.append(`<option id="Week${i}">${weekDates}</option>`);
        }
    }
    
    //Saves the employee's schedule ability at the backend and display it to in another table
    function workAvailability() {
        const availability = Array.from(document.querySelectorAll('input[name="availability"]:checked')).map(checkbox => checkbox.value);
        const unavailability = [];
        const employeeToken = decodeJWT(token).payload;
        const employee = employeesArray.filter(employee => employee.mail === employeeToken.mail);

        $('input[name="availability"]').each(function() {
            if (!$(this).prop('checked')) {
                unavailability.push($(this).val());
            }
        });

        $.ajax({
            url: 'http://localhost:8080/api/workAvailability',
            method: 'POST',
            data: {
                id: employee[0].id,
                name: employee[0].name,
                last_name: employee[0].last_name,
                job_place: employee[0].job_place,
                phone: employee[0].phone,
                mail: employeeToken.mail,
                available: availability.join(' '),
                unavailable: unavailability.join(' '),
            },
            success: function() {
                Swal.fire({
                    title: "Your work schedule submited!",
                    icon: "success",
                    confirmButtonColor: '#cb8119',
                    background: '#d9d9d9',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Confirm'
                });

                availability.map(shift => {
                    if(shift){
                        $(`#${shift}`).html('✔');
                    }
                });
                
                unavailability.map(shift => {
                    $(`#${shift}`).html('');
                })
                
            }
        });

        $('#workOrderForm')[0].reset();
    }

    $('.scheduleTable').hide();
    $('.emploeeys').hide()
    $('.profile').hide();
    $('.mySchedule').hide();
    $('#nextSchedule').hide();
    getMyProfile();
    mainTable(currentWeekNumber);
    getWeekSelects();

    //Activates the function
    $('#workScheduleSubmitBTN').on('click', function(){
        workAvailability();
    });
    
    //Display the previous schedule
    $('#previousSchedule').on('click', function(){
        counter--
        if(counter < currentWeekNumber){
            $('#nextSchedule').show();
        }
        mainTable(counter);
    });

    //Display the next schedule
    $('#nextSchedule').on('click', function(){
        counter++
        if(counter >= currentWeekNumber){
            $('#nextSchedule').hide();
        }
        mainTable(counter);
    });

    //Loging out 
    $('#logoutBTN').on('click', function(){
        localStorage.removeItem("token");
        window.location.href = '/front/index.html'
    });

    //display just the main table div
    $('#CurrentScheduleBTN').on('click', function(){
        mainTable(currentWeekNumber);
        $('.mainTable').show();
        $('.profile').hide();
        $('.scheduleTable').hide();
        $('.emploeeys').hide();
        $('.mySchedule').hide();
        $('#headerTitle h1').html('Schedule of the week');
    });

    //display just the my schedule div
    $('#MySchedule').on('click', function(){
        $.ajax({
            url: 'http://localhost:8080/api/getWorkAvailability',
            success: function(data) {
                const employeeMail = decodeJWT(token).payload.mail;
                const findEmployee = data.filter(employee => employee.mail === employeeMail);
                
                const availability = findEmployee[0].availability.split(' ');
                const unavailability = findEmployee[0].unavailability.split(' ');
                if(findEmployee){
                    availability.map(shift => {
                        if(shift){
                            $(`#${shift}`).html('✔');
                        }
                    });
                    
                    unavailability.map(shift => {
                        $(`#${shift}`).html('');
                    })
                }
            }
        });

        $('.mySchedule').show();
        $('.mainTable').hide();
        $('.profile').hide();
        $('.scheduleTable').hide();
        $('.emploeeys').hide();
        $('#headerTitle h1').html('My schedule');
    });

    //display just the new schedule table div
    $('#NewScheduleBTN').on('click', function(){
        $('.availabilityDIV').hide();
        $('.scheduleTable').show();
        $('.mainTable').hide();
        $('.emploeeys').hide();
        $('.profile').hide();
        $('.mySchedule').hide();
        $('#headerTitle h1').html('New schedule');
    });

    //display just the employees system div
    $('#EmploeeysSystemBTN').on('click', function(){
        getEmployees();
        $('.emploeeys').show();
        $('.scheduleTable').hide();
        $('.mainTable').hide();
        $('.profile').hide();
        $('.mySchedule').hide();
        $('#headerTitle h1').html('Employee system');
    });

    //display just the profile div
    $('#ProfileBTN').on('click', function(){
        getMyProfile();
        $('.profileEditForm').hide()
        $('.profile').show()
        $('.scheduleTable').hide();
        $('.emploeeys').hide();
        $('.mainTable').hide();
        $('.mySchedule').hide();
        $('#headerTitle h1').html('My Profile');
    });


    //Select the time, employee and his job for the morning schedule by days
    $('.scheduleTable').on('click', '#morningBTN', function(){
        Swal.fire({
            html: days.map((day, index) => `
                <h5>${day} morning:</h5>
                <div>
                    <div id="${day}">
                    ${(morningSchedule.length <= 0) ?
                        `<div>
                            <input class="shiftTime" type="time">
                            <select class="selectEmployee" id="selectEmployeeId"><option>-</option>${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`).join('')}</select>
                            <select id="selectJobId">
                                <option></option>
                                <option>Waiter</option>
                                <option>Bartender</option>
                                <option>Kitchen</option>
                            </select>
                        </div>    
                        <br>`
                        :
                        morningSchedule[index].map((shifts, index) => `
                        <div>    
                            <input class="shiftTime" type="time">
                            <select class="selectEmployee" id="selectEmployeeId">
                                <option>${(shifts.split('-'))[1]}</option>
                                ${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`)}
                            </select>
                            <select id="selectJobId">
                                <option>${(shifts.split('-'))[2]}</option>    
                                <option>Waiter</option>
                                <option>Bartender</option>
                                <option>Kitchen</option>
                            </select>
                        </div>
                        <br>
                    `)
                    }
                    </div>
                    <div>
                        <button typr="button" id="addSelect">+</button>
                        <button typr="button" id="removeSelect">-</button>
                    <div>
                </div>
            `).join(''),
            showCancelButton: true,
            confirmButtonColor: '#cb8119',
            background: '#d9d9d9',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Save!'
        }).then((result) => {
            if (result.isConfirmed) {
                const arrayPerDay = [];
                const arrayContent = [];
                days.map(day => {
                    const selectArray = [];
                    const selectArrayContent = [];
                    $(`#${day} #selectEmployeeId`).map(function() {
                        const employee = $(this).val();
                        const time = $(this).siblings().val();
                        const job = $(`#${day} #selectJobId`).val();
                    
                        selectArray.push(time+' - '+employee+' - '+job);
                        selectArrayContent.push(`<p>${time} - ${employee} - ${job}</p>`);
                    });
                    arrayPerDay.push(selectArray);
                    arrayContent.push(selectArrayContent);
                });

                const shiftContent = days.map((day, index) => {
                    return `<td class="tableText">${arrayContent[index].join('<br>')}</td>`;
                });
              
                $(`.morningShift`).html(`
                    <td class="tableText">Morning</td>
                    ${shiftContent}
                `); 

                morningSchedule = [...arrayPerDay];
            }
        });
    });

    //Select the time, employee and his job for the evening schedule by days
    $('.scheduleTable').on('click', '#eveningBTN', function(){
        Swal.fire({
            html: days.map((day, index) => `
                <h5>${day} evening:</h5>
                <div>
                    <div id="${day}">
                    ${(eveningSchedule.length <= 0) ?
                        `<input class="shiftTime" type="time">
                        <select class="selectEmployee" id="selectEmployeeId"><option>-</option>${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`).join('')}</select>
                        <select id="selectJobId">
                            <option></option>
                            <option>Waiter</option>
                            <option>Bartender</option>
                            <option>Kitchen</option>
                        </select><br>`
                        :
                        eveningSchedule[index].map((shifts, index) => `
                        <input class="shiftTime" type="time">
                        <select class="selectEmployee" id="selectEmployeeId">
                            <option>${(shifts.split('-'))[1]}</option>
                            ${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`)}
                        </select>
                        <select id="selectJobId">
                            <option></option>
                            <option>Waiter</option>
                            <option>Bartender</option>
                            <option>Kitchen</option>
                        </select><br>
                    `)
                    }
                    </div>
                    <div>
                        <button typr="button" id="addSelect">+</button>
                        <button typr="button" id="removeSelect">-</button>
                    <div>
                </div>
            `).join(''),
            showCancelButton: true,
            confirmButtonColor: '#cb8119',
            background: '#d9d9d9',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Save!'
        }).then((result) => {
            if (result.isConfirmed) {
                const arrayPerDay = [];
                const arrayContent = [];
                days.map(day => {
                    const selectArray = [];
                    const selectArrayContent = [];
                    $(`#${day} select`).map(function() {
                        const employee = $(this).val();
                        const time = $(this).siblings().val();

                        selectArray.push(time+' - '+employee);
                        selectArrayContent.push(`<p>${time} - ${employee}</p>`);
                    });
                    arrayPerDay.push(selectArray);
                    arrayContent.push(selectArrayContent);
                });

                const shiftContent = days.map((day, index) => {
                    return `<td class="tableText">${arrayContent[index].join('<br>')}</td>`;
                });
              
                $(`.eveningShift`).html(`
                    <td class="tableText">Evening</td>
                    ${shiftContent}
                `); 

                eveningSchedule = [...arrayPerDay];
            }
        });
    });
    
    //Select the time, employee and his job for the night schedule by days
    $('.scheduleTable').on('click', '#nightBTN', function(){
        Swal.fire({
            html: days.map((day, index) => `
                <h5>${day} night:</h5>
                <div>
                    <div id="${day}">
                    ${(nightSchedule.length <= 0) ?
                        `<input class="shiftTime" type="time">
                        <select class="selectEmployee" id="selectEmployeeId"><option>-</option>${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`).join('')}</select>
                        <select id="selectJobId">
                            <option></option>
                            <option>Waiter</option>
                            <option>Bartender</option>
                            <option>Kitchen</option>
                        </select><br>`
                        :
                        nightSchedule[index].map((shifts, index) => `
                        <input class="shiftTime" type="time">
                        <select class="selectEmployee" id="selectEmployeeId">
                            <option>${(shifts.split('-'))[1]}</option>
                            ${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`)}
                        </select>
                        <select id="selectJobId">
                            <option></option>
                            <option>Waiter</option>
                            <option>Bartender</option>
                            <option>Kitchen</option>
                        </select><br>
                    `)
                    }
                    </div>
                    <div>
                        <button typr="button" id="addSelect">+</button>
                        <button typr="button" id="removeSelect">-</button>
                    <div>
                </div>
            `).join(''),
            showCancelButton: true,
            confirmButtonColor: '#cb8119',
            background: '#d9d9d9',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Save!'
        }).then((result) => {
            if (result.isConfirmed) {
                const arrayPerDay = [];
                const arrayContent = [];
                days.map(day => {
                    const selectArray = [];
                    const selectArrayContent = [];
                    $(`#${day} select`).map(function() {
                        const employee = $(this).val();
                        const time = $(this).siblings().val();

                        selectArray.push(time+' - '+employee);
                        selectArrayContent.push(`<p>${time} - ${employee}</p>`);
                    });
                    arrayPerDay.push(selectArray);
                    arrayContent.push(selectArrayContent);
                });

                const shiftContent = days.map((day, index) => {
                    return `<td class="tableText">${arrayContent[index].join('<br>')}</td>`;
                });
              
                $(`.nightShift`).html(`
                    <td class="tableText">Night</td>
                    ${shiftContent}
                `); 

                nightSchedule = [...arrayPerDay];
            }
        });
    });

    //Select the time, employee and his job for the supervisor schedule by days
    $('.scheduleTable').on('click', '#supervisorBTN', function(){
        Swal.fire({
            html: days.map((day, index) => `
                <h5>${day} evening:</h5>
                <div>
                    <div id="${day}">
                    ${(supervisorSchedule.length <= 0) ?
                        `<input class="shiftTime" type="time">
                        <select class="selectEmployee" id="selectEmployeeId"><option>-</option>${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`).join('')}</select>
                        <select id="selectJobId">
                            <option></option>
                            <option>Waiter</option>
                            <option>Bartender</option>
                            <option>Kitchen</option>
                        </select><br>`
                        :
                        supervisorSchedule[index].map((shifts, index) => `
                        <input class="shiftTime" type="time">
                        <select class="selectEmployee" id="selectEmployeeId">
                            <option>${(shifts.split('-'))[1]}</option>
                            ${employeesArray.map(employee => `<option>${employee.name + ' ' + employee.last_name}</option>`)}
                        </select>
                        <select id="selectJobId">
                            <option></option>
                            <option>Waiter</option>
                            <option>Bartender</option>
                            <option>Kitchen</option>
                        </select><br>
                    `)
                    }
                    </div>
                    <div>
                        <button typr="button" id="addSelect">+</button>
                        <button typr="button" id="removeSelect">-</button>
                    <div>
                </div>
            `).join(''),
            showCancelButton: true,
            confirmButtonColor: '#cb8119',
            background: '#d9d9d9',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Save!'
        }).then((result) => {
            if (result.isConfirmed) {
                const arrayPerDay = [];
                const arrayContent = [];
                days.map(day => {
                    const selectArray = [];
                    const selectArrayContent = [];
                    $(`#${day} select`).map(function() {
                        const employee = $(this).val();
                        const time = $(this).siblings().val();

                        selectArray.push(time+' - '+employee);
                        selectArrayContent.push(`<p>${time} - ${employee}</p>`);
                    });
                    arrayPerDay.push(selectArray);
                    arrayContent.push(selectArrayContent);
                });

                const shiftContent = days.map((day, index) => {
                    return `<td class="tableText">${arrayContent[index].join('<br>')}</td>`;
                });
              
                $(`.supervisorShift`).html(`
                    <td class="tableText">Supervisor</td>
                    ${shiftContent}
                `); 

                arrayPerDay.map(arr => {
                    supervisorSchedule.push(arr);
                })
            }
        });
    });

    //Add select options
    $(document).on('click', '#addSelect', function(){
        const selectDiv = $(this).parent().siblings();

        selectDiv.append(`
            <div style="margin-top: -25px;">
                <input class="shiftTime" type="time">
                <select class="selectEmployee" id="selectEmployeeId">"><option>-</option>${employeesArray.map(employee => `<option>${employee.name+' '+employee.last_name}</option>`).join('')}</select>
                <select id="selectJobId">
                    <option></option>
                    <option>Waiter</option>
                    <option>Bartender</option>
                    <option>Kitchen</option>
                </select>
            </div>
            <br>
        `);
    });

    //Remove select options
    $(document).on('click', '#removeSelect', function(){
        const selectDiv = ($(this).parent().siblings()).find('div');
        const timeDiv = ($(this).parent().siblings()).find('input');
        const selectIndex = selectDiv.length-1;
        const br = $(this).parent().siblings().find('br');

        if(selectDiv.length === 1 || timeDiv.length === 1){
            return;
        }else{
          selectDiv[selectIndex].remove();
          br[br.length-1].remove();
        }
    });

    //Save the new schedule
    $('.scheduleTable').on('click', '#saveBTN', function(){
        if( morningSchedule.length === 0 || eveningSchedule.length === 0 || supervisorSchedule.length === 0 || !weekId){
            $('#saveError').html('<p>The week and the table have to be full</p>');
        }else{
            $('#saveError').html('');
            $.ajax({
                url: 'http://localhost:8080/api/saveMorningShift',
                method: 'POST',
                data: {
                    token: token,
                    id: weekId,
                    sunday: morningSchedule[0],
                    monday: morningSchedule[1],
                    tuesday: morningSchedule[2],
                    wednesday: morningSchedule[3],
                    thursday: morningSchedule[4],
                    friday: morningSchedule[5],
                    saturday: morningSchedule[6]
                },
                success: function(data) {
                    Swal.fire('Saved!', 'success');
                }
            });

            $.ajax({
                url: 'http://localhost:8080/api/saveEveningShift',
                method: 'POST',
                data: {
                    token: token,
                    id: weekId,
                    sunday: eveningSchedule[0],
                    monday: eveningSchedule[1],
                    tuesday: eveningSchedule[2],
                    wednesday: eveningSchedule[3],
                    thursday: eveningSchedule[4],
                    friday: eveningSchedule[5],
                    saturday: eveningSchedule[6]
                },
                success: function(data) {
                    Swal.fire('Saved!', 'success');
                }
            });
            
            if(nightSchedule.length > 0){
                $.ajax({
                    url: 'http://localhost:8080/api/saveNightShift',
                    method: 'POST',
                    data: {
                        token: token,
                        id: weekId,
                        sunday: nightSchedule[0],
                        monday: nightSchedule[1],
                        tuesday: nightSchedule[2],
                        wednesday: nightSchedule[3],
                        thursday: nightSchedule[4],
                        friday: nightSchedule[5],
                        saturday: nightSchedule[6]
                    },
                    success: function(data) {
                        Swal.fire('Saved!', 'success');
                    }
                });
            }else{
                $.ajax({
                    url: 'http://localhost:8080/api/deleteNightShift',
                    method: 'DELETE',
                    data: {
                        id: weekId,
                        token: token
                    },
                success: function(data) {
                    console.log('Data received:', data);
                }
                });
            }

            $.ajax({
                url: 'http://localhost:8080/api/saveSupervisorShift',
                method: 'POST',
                data: {
                    token: token,
                    id: weekId,
                    arrayData: supervisorSchedule
                },
                success: function(data) {
                    Swal.fire('Saved!', 'success');
                }
            });

            morningSchedule = [];
            eveningSchedule = [];
            nightSchedule = [];
            supervisorSchedule = [];
            weekId = '';
            
            getWeekSelects();

            days.map(day => {
                $(`#${day}Title`).html(``);
            });
            
            $('.tableText').html(`
            <th>Shift</th>
            <th id="SundayTitle">Sunday</th>
            <th id="MondayTitle">Monday</th>
            <th id="TuesdayTitle">Tuesday</th>
            <th id="WednesdayTitle">Wednesday</th>
            <th id="ThursdayTitle">Thursday</th>
            <th id="FridayTitle">Friday</th>
            <th id="SaturdayTitle">Saturday</th>
        `)
        
        $('#tableTbody').html(`
            <tr class="morningShift">
                <td class="tableText">Morning</td>
            </tr>
            <tr class="eveningShift"> 
                <td class="tableText">Evening</td>
            </tr>
            <tr class="supervisorShift">
                <td class="tableText">Shift supervisor</td>
            </tr>
        `);
        }
    });

    //Add table row
    $('#addTrBTN').on('click', function(){
        $('#nightBTN').show();
        $('#subtractTrBTN').show();
        
        $('#tableTbody').html(`
            <tr class="morningShift">
                <td class="tableText">Morning</td>
            </tr>
            <tr class="eveningShift"> 
                <td class="tableText">Evening</td>
            </tr>
            <tr class="nightShift"> 
                <td class="tableText">Night</td>
            </tr>
            <tr class="supervisorShift">
                <td class="tableText">Shift supervisor</td>
            </tr>
       `);
        
       $('#addTrBTN').hide();
    });

    //Subtract table row
    $('#subtractTrBTN').on('click', function(){
        $('#addTrBTN').show();
        $('#subtractTrBTN').hide();
        $('#nightBTN').hide();

        $('.nightShift').remove();
    });

    //Clears the table at the new schedule
    $('.scheduleTable').on('click', '#clearBTN', function(event){
        $('#saveError').html('');
        morningSchedule = [];
        eveningSchedule = [];
        supervisorSchedule = [];
        weekId = '';
        
        getWeekSelects();

        $('.tableText').html(`
            <th>Shift</th>
            <th id="SundayTitle">Sunday</th>
            <th id="MondayTitle">Monday</th>
            <th id="TuesdayTitle">Tuesday</th>
            <th id="WednesdayTitle">Wednesday</th>
            <th id="ThursdayTitle">Thursday</th>
            <th id="FridayTitle">Friday</th>
            <th id="SaturdayTitle">Saturday</th>
        `)
        
        $('#tableTbody').html(`
            <tr class="morningShift">
                <td class="tableText">Morning</td>
            </tr>
            <tr class="eveningShift"> 
                <td class="tableText">Evening</td>
            </tr>
            <tr class="supervisorShift">
                <td class="tableText">Shift supervisor</td>
            </tr>
        `);
    });

    //Displays the buttons with the names of the employees at the new schedule
    $('#availabilityBTN').on('click', function(){
        $('.availabilityDIV').toggle();
        $('.availabilityDIV').html('');
    
        $.ajax({
            url: 'http://localhost:8080/api/getWorkAvailability',
            success: function(data) {
                employeesArray.map(employee => {
                    const employeeAvailability = data.find(res => res.id === employee.id);
    
                    if (employeeAvailability) {
                        const splitedEmployeeAvailability = (employeeAvailability.availability).split(' ');
                        const splitedEmployeeUnavailability = (employeeAvailability.unavailability).split(' ');

                        $('.availabilityDIV').append(`
                            <div class="col-xs-3" id="employeeAvailability">
                                <button class="employeeAvailabilityBTN" id="${employee.id}">${employee.name+' '+employee.last_name}</button>
                                <div class="availableDIV" id="availableDIV${employee.id}"> 
                                    <div id="availability"><h5>Availability</h5><br>${splitedEmployeeAvailability.map(item => `<span>${item}</span>`).join('<br><br>')}</div>
                                    <div id="unavailability"><h5>Unavailability</h5><br>${splitedEmployeeUnavailability.map(item => `<span>${item}</span>`).join('<br><br>')}</div>
                                </div>
                            </div>
                        `);
                    }else{
                        $('.availabilityDIV').append(`
                            <div class="col-xs-3" id="employeeAvailability">
                                <button class="employeeAvailabilityBTN" id="${employee.id}">${employee.name+' '+employee.last_name}</button>
                                <div class="availableDIV" id="availableDIV${employee.id}"> 
                                    <div id="availability">No work availability was submitted</div>
                                </div>
                            </div>
                        `);
                    }
                    $('.availableDIV').hide();
                });
            }
        });
    });

    //According to each employee shows his Work availability
    $('.availabilityDIV').on('click', '.employeeAvailabilityBTN', function(event){
        const id = this.id;
        const employeeAvailability = data.find(res => res.id === +id);

        if (employeeAvailability) {
            const splitedEmployeeAvailability = (employeeAvailability.availability).split(' ');
            const splitedEmployeeUnavailability = (employeeAvailability.unavailability).split(' ');
            swal.fire({
                confirmButtonColor: '#cb8119',
                background: '#d9d9d9',
                html:`
                <div class="swalAvailability">
                    <div class="text" id="availability"><h5>Availability</h5><br>${splitedEmployeeAvailability.map(item => `<span>${item}</span>`).join('<br><br>')}</div>
                    <div class="text" id="unavailability"><h5>Unavailability</h5><br>${splitedEmployeeUnavailability.map(item => `<span>${item}</span>`).join('<br><br>')}</div>
                </div>
            `});
        }else{
            swal.fire({
                confirmButtonColor: '#cb8119',
                background: '#d9d9d9',
                html:`
                        <div id="availability"><h5>No work availability was submitted</5></div>
            `});
        }
        
    });

    //Edit the profile data
    $('.profile').on('click', '#profileEditBTN', function(){
        const employeeMail = decodeJWT(token).payload.mail;
        const employee = (employeesArray.filter(employee => employee.mail === employeeMail));
        console.log(employee);
        console.log(employee[0].mail);
        console.log(employee[0].job_place);
        Swal.fire({
            title: "Enter your password",
            input: "password",
            confirmButtonColor: '#cb8119',
            background: '#d9d9d9',
            cancelButtonColor: '#d33',
            confirmButtonText: "Confirm",
            showCancelButton: true,
            inputAttributes: {
                autocapitalize: "off"
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const enteredPassword = result.value;
                console.log(enteredPassword)
                $.ajax({
                    url: 'http://localhost:8080/api/passworsValid',
                    method: 'POST',
                    data:{
                        mail: employee[0].mail,
                        jobPlace: employee[0].job_place,
                        password: enteredPassword
                    },
                    success: function(data) {
                        console.log(data);
                        if (data.token) {
                            Swal.fire({
                                title: "Password is valid!",
                                icon: "success",
                                confirmButtonColor: '#cb8119',
                                background: '#d9d9d9',
                                cancelButtonColor: '#d33',
                            });
            
                            $('.profile').html(`
                                <div class="profileEditForm">
                                    <form method="post">
                                        <input type="text" id="profileEditId" placeholder="ID" value="${employee[0].id}" disabled><br>
                                        <input type="text" id="profileEditRank" placeholder="rank" value="${(employee[0].is_admin === 1) ? 'Manager': 'Employee'}" disabled><br>
                                        <input type="text" id="profileEditName" placeholder="Name" value="${employee[0].name}"><br>
                                        <input type="text" id="profileEditLastName" placeholder="Last name" value="${employee[0].last_name}"><br>
                                        <input type="text" id="profileEditMail" placeholder="Mail" value="${employee[0].mail}"><br>
                                        <input type="text" id="profileEditPhone" placeholder="Phone number" value="${employee[0].phone}"><br>
                                        <input type="text" id="profileEditPassword" placeholder="Password" value="${employee[0].password}"><br>
                                        <div id="profileEditError" class="error"></div>
                                        <button type="button" id="profileCancelBTN" class="buttons">Cancel <i class="fa-solid fa-ban"></i></button>
                                        <button type="button" id="profileSaveBTN" class="buttons">Save <i class="fa-solid fa-floppy-disk"></i></button>    
                                    </form>  
                                </div>
                            `);
            
                            $('#profileData').hide();
                            $('.profileEditForm').show();
                        } 
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        console.log(textStatus);
                        Swal.fire({
                            title: "Invalid password",
                            icon: "error",
                            confirmButtonColor: '#cb8119',
                            background: '#d9d9d9',
                            cancelButtonColor: '#d33'
                        });
                    }
                });
            }
        });
          
        async function validatePassword(password) {
            return password === employee[0].password;
        }  
    });
    
    //Save profile changes
    $('.profile').on('click', '#profileSaveBTN', function(){
        $('#profileEditError').html('');
        const id = $('#profileEditId').val();
        const rank = $('#profileEditRank').val();
        const name = $('#profileEditName').val();
        const lastName = $('#profileEditLastName').val();
        const mail = $('#profileEditMail').val();
        const phone = $('#profileEditPhone').val();
        const password = $('#profileEditPassword').val();

        const employeeMail = decodeJWT(token).payload.mail;
        const allMails = (employeesArray.filter(employee => employee.mail !== employeeMail));

        if(!name || !lastName || !mail || !phone || !password ){
            $('#profileEditError').html('All fields are must');
            return false;
        }

        if (phone.length !== 10) {
            $('#profileEditError').html("Phone number must be 10 characters long");
            return false;
        }

        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!mail.match(emailPattern)) {
            $('#profileEditError').html("Invalid email address");
            return false;
        }

        if(allMails.map(email => email === mail)){
            $('#profileEditError').html("This mail is alredy exist in system");
        }

        const letterCount = password.replace(/[^a-zA-Z]/g, "").length;
        const numberCount = password.replace(/[^0-9]/g, "").length;
        if (letterCount < 4 || numberCount < 3) {
            $('#profileEditError').html("Password must have at least 4 letters and 3 numbers");
            return false;
        }
                
        $.ajax({
            url: 'http://localhost:8080/api/editProfile',
            method: 'POST',
            data: {id, rank, name, lastName, phone, mail, password},
            success: function(data) {
                getMyProfile();
            }
        }); 
    });

    //Cancel the edit of the profile and returns to original data
    $('.profile').on('click', '#profileCancelBTN', function(){
        $('.profileEditForm').hide();
        getMyProfile()
    });

    //Append the exact date to each day by choose the week
    newScheduleWeekSelect.on('change', function(evet){
        const id = $(this).children("option:selected").attr("id");
        weekId = id;

        if (weekId !== undefined) {
            const oneDayMillisecondes = 86400000;
            const getDate = (($('#newScheduleWeekSelect').val()).split('-')[1]);
            const splitedDate = (getDate.split(' ')[1]).split('/');
            const dateFormat = splitedDate[1]+'/'+splitedDate[0]+'/'+splitedDate[2];
            const dateMillisecondes = new Date(dateFormat).getTime();

            let date = dateMillisecondes;

            days.map(day => {
                $(`#${day}Title`).html(`${day}<br>${new Date(date).toLocaleDateString()}`);
                date += oneDayMillisecondes
            });
        }else{
            days.map(day => {
                $(`#${day}Title`).html(``);
            });
        }
    });

    //Checks that every input is valid and save the data at the backend
    $('#registerBTN').on('click', function(){
        $('#registerError').html('');
        
        const id = $('#registerID').val();
        const name = $('#registerName').val();
        const lastName = $('#registerLastName').val();
        const jobPlace = $('#registerJobPlace').val();
        const phone = $('#registerPhone').val();
        const mail = $('#registerMail').val();
        const password = $('#registerPassword').val();
        

        if(!id || !name || !lastName || !jobPlace || !phone || !mail || !password ){
            $('#registerError').html('All fields are must');
            return false;
        }

        if (id.length !== 9) {
            $('#registerError').html("ID must be 9 Numbers");
            return false;
        }
        
        if (phone.length !== 10) {
            $('#registerError').html("Phone number must be 10 characters long");
            return false;
        }

        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!mail.match(emailPattern)) {
            $('#registerError').html("Invalid email address");
            return false;
        }

        const letterCount = password.replace(/[^a-zA-Z]/g, "").length;
        const numberCount = password.replace(/[^0-9]/g, "").length;
        if (letterCount < 4 || numberCount < 3) {
            $('#registerError').html("Password must have at least 4 letters and 3 numbers");
            return false;
        }
            $.ajax({
                url: 'http://localhost:8080/api/allUesres',
                success: function(data) {
                alert('shh');
                console.log(data);
                console.log(id)
                const findUserId = data.filter(userData => userData.id ===  +id);
                console.log(findUserId);
                const findUserPhone = data.filter(userData => userData.phone ===  phone);
                const findUserMail = data.filter(userData => userData.mail ===  mail);

                if (findUserId.length > 0) {
                    $('#registerError').html('This ID is alredy exist in system');
                    return false;
                } 
                
                if (findUserMail.length > 0) {
                    $('#registerError').html('This mail is alredy exist in system');
                    return false;
                } 

                if (findUserPhone.length > 0) {    
                    $('#registerError').html('This phone is alredy exist in system');
                    return false;
                } 
        
                $.ajax({
                    url: 'http://localhost:8080/api/register',
                    method: 'POST',
                    data: {id, name, lastName, phone, mail, password, jobPlace},
                    success: function(data) {
                        window.location.href= '/front/index.html'
                    }
                }); 
            }
        });
    });

    //Check if the email exists in the system and if it's exists, the function checks the compatibility of the password 
    $('#loginBTN').on('click', function(){
        const mail = $('#loginMail').val();
        const password = $('#loginPassword').val();
        const jobPlace = $('#loginJobPlace').val();
        
        $.ajax({
            url: 'http://localhost:8080/api/login',
            data:{
                password: password,
                mail: mail,
                jobPlace: jobPlace
            },
            success: function(data) {
                console.log(data.user);
                const findUser = data.user;
                
                if (findUser) {
                    if (findUser.job_place === jobPlace) {
                        $('.error').html('<p>Logging in</p>');

                        localStorage.setItem('token', data.token);
                        window.location.href= '/front/main.html';
                    } else {
                        $('.error').html("<p>Job place Doesn't match details</p>");
                    }
                }
            },
            error: function(xhr, status, error) {
                $('.error').html(`<p>Email or password worng</p>`);
            }
        });
    });

    //Navigate to registration page
    $('#toRegistrationBTN').on('click', function(){
        window.location.href = '/front/register.html';
    });
    
    //Navigate to login page
    $('#toLoginBTN').on('click', function(){
        window.location.href = '/front/index.html';
    });

    //Check if the details are exists at the system, and save the data at the backend
    $('#addEmployeeBTN').on('click', function(event){
        event.preventDefault();
        const date = ((new Date()).toLocaleDateString()).split('/');
        const formatedDate = `${date[2]}-${date[1]}-${date[0]}`

        const id = $('#employeeId').val();
        const name =  $('#employeeName').val();
        const lastName = $('#employeeLastName').val();
        const phone = $('#employeePhone').val();
        const mail = $('#employeeMail').val();
        const password = $('#employeePassword').val();

        const findEmployeeId = employeesArray.find(employee => employee.id === +id);
        const findEmployeePhone = employeesArray.find(employee => employee.phone === phone);
        const findEmployeeMail = employeesArray.find(employee => employee.mail === mail);
        
        if(!id || !name || !lastName || !phone || !mail || !password ){
            $('#addEmployeeError').html('All fields are must');
            return false;
        }

        if (id.length !== 9) {
            $('#addEmployeeError').html("ID must be 9 Numbers");
            return false;
        }
        
        if (phone.length !== 10) {
            $('#addEmployeeError').html("Phone number must be 10 characters long");
            return false;
        }

        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!mail.match(emailPattern)) {
            $('#addEmployeeError').html("Invalid email address");
            return false;
        }

        const letterCount = password.replace(/[^a-zA-Z]/g, "").length;
        const numberCount = password.replace(/[^0-9]/g, "").length;
        if (letterCount < 4 || numberCount < 3) {
            $('#addEmployeeError').html("Password must have at least 4 letters and 3 numbers");
            return false;
        }

        if(findEmployeeId){
            $('#addEmployeeError').html('This ID is alredy exist in system');
            return false;
        }
        
        if(findEmployeePhone){
            $('#addEmployeeError').html('phone number is already in system');
            return false;
        }

        if (findEmployeeMail) {
            $('#addEmployeeError').html("Mail is alredy exist in system");
            return false;
        }

        const employee = {
            date: formatedDate,
            id: id,
            name: name,
            last_name: lastName,
            phone: phone,
            mail: mail,
            password: password,
            token: token
        };

        $.ajax({
            url: 'http://localhost:8080/api/addEmployee',
            method: 'POST',
            data: employee,
            success: function(data) {
                employeesArray.push(employee);
                
                $('#employeeId, #employeeName, #employeeLastName, #employeePhone, #employeeMail, #employeePassword').val('');
            
                getEmployees();
            }
        }); 
    });

    //Delete an employee
    $('#allEmployees').on('click', '.deleteBTN', function(event){
        const id = event.target.id;
        const dataId = $(this).data('id');


        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: 'http://localhost:8080/api/deleteEmployee',
                    method: 'DELETE',
                    data: {id},
                success: function(data) {
                    employeesArray.splice(dataId, 1);

                    getEmployees();
                }
                });

                Swal.fire(
                'Deleted!',
                'Your file has been deleted.',
                'success'
                );
            }
        })
    });

    //Display employee data
    $('#allEmployees').on('click', '.dataBTN', function(event){
        const id = event.target.id;
        const dataId = $(this).data('id');

        const emploeey = employeesArray.filter(emploeey => emploeey.id === +id)[0];

        Swal.fire({
            title: `${emploeey.name} ${emploeey.last_name}`,
            html: `
                <div class="employeeData">
                    <p>ID: ${emploeey.id}</p>
                    <p>Mail: ${emploeey.mail}</p>
                    <p>Phone: ${emploeey.phone}</p>
                    <p>Start at: ${emploeey.date}</p>
                </div>
            `,
            confirmButtonColor: '#cb8119',
            background: '#d9d9d9',
            confirmButtonText: 'Confirm'
        });


    });
});


