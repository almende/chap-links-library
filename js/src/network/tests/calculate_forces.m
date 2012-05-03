# calculate force paterns


length = 100;
stiffness = 1/length;

x = [0 : 0.1 : length*2];
repulsionForce = 1 * exp(-5 * (x .* x) / (length * length) );
repulsionForce2 = 1 * exp(-2 * (x .* x) / (length * length) );
#repulsionForce2 = min(0.1 ./ (x / length), 1)  ;
repulsionForce2 =  1 ./ (1 + exp(-(length - x) / length*10) );
repulsionForce2 =  1 ./ (1 + exp((x / length - 1) * 20) );
springForce = stiffness * (x - length);


plot(x, repulsionForce, x, repulsionForce2, x, springForce);
legend (['repulsion force'; 'repulsion force 2'; 'stiffness']);
xlabel('link length');
ylabel('force');
